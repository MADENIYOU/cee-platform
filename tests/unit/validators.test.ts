import { describe, expect, it } from "vitest";
import { validateUploadedFile } from "@/lib/upload/validators";

// En-tête PDF minimal (suffisant pour la détection par octets de `file-type`).
const PDF_HEADER = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\n");
// Signature ZIP standard ("PK\x03\x04").
const ZIP_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);

describe("validateUploadedFile", () => {
  it("accepte un PDF valide dans la limite de taille", async () => {
    const result = await validateUploadedFile(PDF_HEADER, {
      allowedTypes: ["application/pdf"],
    });

    expect(result.valid).toBe(true);
  });

  it("rejette une archive ZIP même si le type est déclaré autorisé", async () => {
    const result = await validateUploadedFile(ZIP_HEADER, {
      allowedTypes: ["application/zip", "application/pdf", "image/*"],
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/archives/i);
    }
  });

  it("rejette un fichier dépassant la taille max de sa catégorie", async () => {
    const result = await validateUploadedFile(PDF_HEADER, {
      allowedTypes: ["application/pdf"],
      maxSizeBytes: { "application/pdf": 1 }, // 1 octet — garantit le dépassement
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/volumineux/i);
    }
  });

  it("rejette un type non présent dans la liste autorisée", async () => {
    const result = await validateUploadedFile(PDF_HEADER, {
      allowedTypes: ["image/*"],
    });

    expect(result.valid).toBe(false);
  });
});
