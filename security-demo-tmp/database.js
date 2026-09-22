// ============================================================
// INTENTIONAL SQL INJECTION TEST
// ============================================================
//
// Demonstrates unsafe construction of a SQL query using
// untrusted user input.
//
// ============================================================

function findUser(db, username) {

    // INTENTIONAL VULNERABILITY:
    // User input is concatenated directly into SQL.
    const query =
        "SELECT * FROM users WHERE name = '" + username + "'";

    return db.query(query);
}

module.exports = { findUser };
