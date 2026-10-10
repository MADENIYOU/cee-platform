import { describe, expect, it } from "vitest";
import { isAllowedEmailDomain } from "@/lib/auth/domains";

describe("isAllowedEmailDomain", () => {
  it("accepte une adresse @esp.sn", () => {
    expect(isAllowedEmailDomain("etudiant@esp.sn")).toBe(true);
  });

  it("accepte une adresse @gmail.com", () => {
    expect(isAllowedEmailDomain("etudiant@gmail.com")).toBe(true);
  });

  it("refuse une adresse @ucad.edu.sn", () => {
    expect(isAllowedEmailDomain("etudiant@ucad.edu.sn")).toBe(false);
  });

  it("refuse une adresse vide ou absente", () => {
    expect(isAllowedEmailDomain("")).toBe(false);
    expect(isAllowedEmailDomain(null)).toBe(false);
    expect(isAllowedEmailDomain(undefined)).toBe(false);
  });

  it("n'est pas sensible à la casse du domaine", () => {
    expect(isAllowedEmailDomain("etudiant@ESP.SN")).toBe(true);
  });
});
