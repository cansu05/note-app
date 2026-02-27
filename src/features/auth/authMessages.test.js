import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, validateAuthForm, validateEmail } from "./authMessages";

describe("authMessages", () => {
  it("maps known firebase error code", () => {
    expect(getAuthErrorMessage("auth/invalid-credential")).toBe("E-posta veya şifre hatalı.");
  });

  it("validates email", () => {
    expect(validateEmail("")).toBe("Lütfen e-posta gir.");
    expect(validateEmail("abc")).toBe("Lütfen geçerli bir e-posta adresi gir.");
    expect(validateEmail("test@example.com")).toBe("");
  });

  it("validates register form", () => {
    expect(
      validateAuthForm({
        mode: "register",
        fullName: "",
        email: "test@example.com",
        password: "123456"
      })
    ).toBe("Lütfen ad soyad gir.");
  });
});
