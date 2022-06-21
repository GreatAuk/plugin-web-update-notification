// https://docs.cypress.io/api/introduction/api.html
import {
  NOTIFICATION_ANCHOR_CLASS_NAME,
  INJECT_STYLE_FILE_NAME,
  INJECT_SCRIPT_FILE_NAME,
  JSON_FILE_NAME,
} from "vite-plugin-web-update-notification";

describe("test vite-plugin-web-update-notification", () => {
  it("page access", () => {
    cy.visit("/");
    cy.contains("h1", "You did it!");
  });
  it("script and css file inject", () => {
    cy.get("head")
      .find(`script[src="${INJECT_SCRIPT_FILE_NAME}.js"]`)
      .should("exist");
    cy.get("head")
      .find(`link[href="${INJECT_STYLE_FILE_NAME}.css"]`)
      .should("exist");
  });
  it("notification anchor element should exist", () => {
    cy.get(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`).should("exist");
  });

  it("should has a git-commit-hash.json file", () => {
    cy.request(`${JSON_FILE_NAME}.json`).then((res) => {
      expect(res.body).to.have.property("hash");
      expect(res.body.hash).to.have.lengthOf(7);
    });
  });

  it(`don't show notification when hash is the same`, () => {
    cy.visit("/");
    cy.get(`[data-cy="notification-content"]`).should("not.exist");
  });

  it("should show a notification after system update", () => {
    cy.intercept(
      {
        method: "GET", // Route all GET requests
        url: `/${JSON_FILE_NAME}.json?*`, // that have a URL that matches
      },
      {
        hash: "sdud23d",
      } // and force the response
    ).as("versionFetch");
    cy.visit("/");
    cy.wait("@versionFetch", { timeout: 40 * 1000 });
    cy.get(`[data-cy="notification-content"]`).should("exist");

    // custom notification text
    cy.get(`[data-cy="notification-content"]`).contains("system update");
    cy.get(`[data-cy="notification-content"]`).contains("refresh");
  });
});
