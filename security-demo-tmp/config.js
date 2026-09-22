// ============================================================
// INTENTIONAL SECURITY TEST
// ============================================================
//
// This file contains a FAKE credential.
// It does not belong to any real service.
//
// It exists only to demonstrate secret detection.
//
// ============================================================

const config = {
    apiKey: "DEMO_SECRET_SUPER_SECRET_VALUE",
    password: "DEMO_ONLY_FAKE_PASSWORD"
};

module.exports = config;
