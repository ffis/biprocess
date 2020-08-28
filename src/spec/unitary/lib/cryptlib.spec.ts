import { crypt, decrypt, cryptPassword, comparePassword } from "../../../lib/cryptlib";

describe("CryptLib", () => {
    it("should be able to crypt and decrypt", () => {
        const content = "this is a test";
        const password = "this is a password";

        const decrypted = decrypt(password, crypt(password, content));
        expect(decrypted).toEqual(content);
    });

    it("should be able to check for a password", async () => {
        const password = "this is a password";
        const cryptedPassword = await cryptPassword(password);

        expectAsync(comparePassword(password, cryptedPassword)).toBeResolvedTo(true);
    })
});
