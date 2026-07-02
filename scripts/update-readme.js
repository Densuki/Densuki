const fs = require("fs");
const path = require("path");

const README_PATH = path.join(__dirname, "..", "README.md");

// ========================================
// CONFIGURAÇÃO
// ========================================

const USER = {
    birthday: {
        year: 2000,
        month: 3,
        day: 3
    }
};

// ========================================
// FUNÇÕES
// ========================================

function calculateAge() {

    const today = new Date();

    let age = today.getFullYear() - USER.birthday.year;

    const birthdayThisYear = new Date(
        today.getFullYear(),
        USER.birthday.month - 1,
        USER.birthday.day
    );

    if (today < birthdayThisYear) {
        age--;
    }

    return age;
}

function replacePlaceholder(content, key, value) {

    const regex = new RegExp(
        `<!--\\s*${key}_START\\s*-->.*?<!--\\s*${key}_END\\s*-->`,
        "gs"
    );

    return content.replace(
        regex,
        `<!-- ${key}_START -->${value}<!-- ${key}_END -->`
    );

}

// ========================================
// EXECUÇÃO
// ========================================

let readme = fs.readFileSync(README_PATH, "utf8");

readme = replacePlaceholder(
    readme,
    "AGE",
    calculateAge()
);

fs.writeFileSync(README_PATH, readme);

console.log("README atualizado com sucesso.");
