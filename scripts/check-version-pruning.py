"""Smoke test da retenção de versões com FKs de edição.

Reproduz o cenário em que uma versão antiga possui linhas em *_edits. A poda deve
remover primeiro os registros dependentes para não quebrar bancos como MySQL.
"""
import os
import sys
from pathlib import Path

from flask import Flask
from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend' / 'api'))
os.environ.setdefault('VERSION_RETENTION_LIMIT', '2')

from models import db, CurriculumVersion, CurriculumEdit, AboutVersion, AboutEdit  # noqa: E402
from services import prune_old_versions  # noqa: E402


def build_app():
    app = Flask('pruning-test')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app


def seed_curriculum_versions():
    for index in range(4):
        version = CurriculumVersion(version=f'1.0.{index}', data={'index': index}, is_current=index == 3)
        db.session.add(version)
        db.session.flush()
        db.session.add(CurriculumEdit(field='index', old_value=str(index - 1), new_value=str(index), version_id=version.id))
    db.session.commit()


def seed_about_versions():
    for index in range(4):
        version = AboutVersion(version=f'1.0.{index}', data={'index': index}, is_current=index == 3)
        db.session.add(version)
        db.session.flush()
        db.session.add(AboutEdit(field='index', old_value=str(index - 1), new_value=str(index), version_id=version.id))
    db.session.commit()


def main():
    app = build_app()
    with app.app_context():
        db.create_all()
        db.session.execute(text('PRAGMA foreign_keys=ON'))
        seed_curriculum_versions()
        seed_about_versions()

        assert prune_old_versions(CurriculumVersion, keep=2) == 2
        assert prune_old_versions(AboutVersion, keep=2) == 2
        db.session.commit()

        assert CurriculumVersion.query.count() == 2
        assert CurriculumEdit.query.count() == 2
        assert AboutVersion.query.count() == 2
        assert AboutEdit.query.count() == 2

    print('version pruning ok')


if __name__ == '__main__':
    main()
