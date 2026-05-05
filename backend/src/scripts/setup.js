const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

async function main() {
  const password = process.argv[2] || process.env.ADMIN_PASSWORD || "";
  const jwtSecret = crypto.randomBytes(64).toString("hex");

  console.log("# Cole estes valores no seu .env de produção");
  console.log(`JWT_SECRET=${jwtSecret}`);

  if (password) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log("");
    console.log("# Senha usada para gerar o hash:");
    console.log(`# ADMIN_PASSWORD=${password}`);
    return;
  }

  console.log("ADMIN_PASSWORD_HASH=");
  console.log("");
  console.log('Use: node scripts/setup.js "SUA_SENHA_FORTE_AQUI"');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
