import { describe, it, expect } from "vitest";
import { hasRole, isPublicRoute, requiredRole, roleFromAppMetadata, safeNextPath } from "./policy";

describe("Sentinel OS access policy", () => {
  it("leaves only the sign-in flow public", () => {
    expect(requiredRole("/login", "GET")).toBeNull();
    expect(requiredRole("/auth/callback", "GET")).toBeNull();
    expect(requiredRole("/auth/signout", "POST")).toBeNull();
    expect(isPublicRoute("/loginx")).toBe(false);
    expect(isPublicRoute("/auth")).toBe(false);
  });

  it("requires a signed-in viewer for pages and reads", () => {
    expect(requiredRole("/", "GET")).toBe("viewer");
    expect(requiredRole("/governance", "GET")).toBe("viewer");
    expect(requiredRole("/brand-portal/index.html", "GET")).toBe("viewer");
    expect(requiredRole("/api/mesh/billing", "GET")).toBe("viewer");
  });

  it("requires editor for mesh mutations and admin for money or client creation", () => {
    expect(requiredRole("/api/mesh/consensus", "POST")).toBe("editor");
    expect(requiredRole("/api/mesh/microproducts", "POST")).toBe("editor");
    expect(requiredRole("/api/mesh/zk-audit", "POST")).toBe("editor");
    expect(requiredRole("/api/mesh/billing", "POST")).toBe("admin");
    expect(requiredRole("/api/mesh/settle", "POST")).toBe("admin");
    expect(requiredRole("/api/mesh/provision", "POST")).toBe("admin");
    expect(requiredRole("/api/mesh/settle", "DELETE")).toBe("admin");
  });

  it("reads the role from app_metadata and defaults to viewer", () => {
    expect(roleFromAppMetadata({ role: "admin" })).toBe("admin");
    expect(roleFromAppMetadata({ role: "editor" })).toBe("editor");
    expect(roleFromAppMetadata({ role: "superuser" })).toBe("viewer");
    expect(roleFromAppMetadata({})).toBe("viewer");
    expect(roleFromAppMetadata(undefined)).toBe("viewer");
  });

  it("ranks roles", () => {
    expect(hasRole("admin", "editor")).toBe(true);
    expect(hasRole("editor", "editor")).toBe(true);
    expect(hasRole("editor", "admin")).toBe(false);
    expect(hasRole("viewer", "editor")).toBe(false);
  });

  it("only redirects to same-origin paths after sign-in", () => {
    expect(safeNextPath("/governance?tab=ledger")).toBe("/governance?tab=ledger");
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
  });
});
