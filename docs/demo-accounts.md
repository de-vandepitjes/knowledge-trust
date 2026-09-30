# Demo accounts

Fictional users for the proof of concept. Passwords are stored as salted scrypt hashes in `data/users.json`; this file is the only place they appear in plain text.

| Username | Password    | Role                  | Clients                            |
| -------- | ----------- | --------------------- | ---------------------------------- |
| `lien`   | `Lien2026!` | Payroll consultant BE | 27 fictional clients (see the app) |
| `tom`    | `Tom2026!`  | Payroll consultant BE | FritzCo Retail                     |

Tom cannot see Lien's clients. Asking about them through the API returns 403; their documents return 404.

To change a password, generate a new hash and replace it in `data/users.json`:

```bash
node -e 'const {scryptSync,randomBytes}=require("node:crypto");const s=randomBytes(16).toString("hex");console.log(s+":"+scryptSync(process.argv[1],s,64).toString("hex"))' "NewPassword"
```
