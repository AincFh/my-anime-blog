// 临时脚本：生成 PBKDF2 密码哈希
// 运行方式: npx tsx scripts/generate-password-hash.ts

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const key = await crypto.subtle.importKey(
        'raw',
        data,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        key,
        256
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${saltHex}:${hashHex}`;
}

// 新密码: AincFh2024
const newPassword = "AincFh2024";

hashPassword(newPassword).then(hash => {
    console.log("New Password:", newPassword);
    console.log("Password Hash:", hash);
    console.log("\n--- SQL Commands ---");
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE id = 1;`);
    console.log(`\n或者插入新管理员：`);
    console.log(`INSERT INTO users (email, password_hash, username, role) VALUES ('admin@example.com', '${hash}', 'Admin', 'admin');`);
});
