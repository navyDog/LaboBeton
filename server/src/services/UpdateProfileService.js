import bcrypt from "bcryptjs";

export function prepareUserUpdates(body) {
    const fields = ['companyName', 'address', 'contact', 'siret', 'apeCode', 'legalInfo', 'logo'];
    const updates = {};

    fields.forEach(field => {
        if (body[field] !== undefined) {
            updates[field] = String(body[field]).substring(0, getMaxLength(field));
        }
    });

    return updates;
}

export function validateLogoSize(logo) {
    if (logo === undefined) return null;

    const logoStr = String(logo);
    if (logoStr.length > 1400000) {
        return { message: "Logo trop volumineux (max 1MB)" };
    }

    return null;
}

export async function handlePasswordUpdate(password, user) {
    if (!password || String(password).trim() === "") return { error: null, fields: {} };

    const pwd = String(password);
    if (pwd.length < 8) return { error: { message: "Mot de passe trop court." }, fields: {} };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pwd, salt);

    return {
        error: null,
        fields: {
            password: hashedPassword,
            tokenVersion: (user.tokenVersion || 0) + 1
        }
    };
}

function getMaxLength(field) {
    const maxLengths = {
        companyName: 100,
        address: 300,
        contact: 100,
        siret: 50,
        apeCode: 20,
        legalInfo: 200,
        logo: 1400000
    };
    return maxLengths[field] || 255;
}