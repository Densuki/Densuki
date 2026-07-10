# backend/api/utils

Funções utilitárias compartilhadas pelo backend.

- `json_utils.py`: leitura/gravação dos JSONs em `docs/data` e dados padrão para inicialização.
- `docx_utils.py`: helpers para manipular documentos gerados em DOCX.

Mantenha aqui apenas funções genéricas. Regras específicas de rota devem ficar em `backend/api/routes` ou em serviços dedicados.
