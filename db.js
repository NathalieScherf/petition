// do database stuff in this file
// create a function for each query, and export the function
var spicedPg = require("spiced-pg");
var db;
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const secrets = require("./secrets");
    db = spicedPg(
        `postgres:${secrets.dbUser}:${secrets.password}@localhost:5432/petition`
    );
}
/*
var db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:${secrets.dbUser}:${secrets.password}@localhost:5432/petition`
);*/

exports.registerUser = (first, last, email, hash) => {
    return db
        .query(
            `INSERT INTO  users (first, last, email, pass)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [first || null, last || null, email || null, hash || null]
        )
        .then(function(results) {
            return results.rows;
        });
};

//only do this query if input field is not empty.
exports.userProfile = (age, city, url, user_id) => {
    return db
        .query(
            `INSERT INTO  user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
            [age || null, city || null, url || null, user_id || null]
        )
        .then(function(results) {
            return results.rows;
        });
};
// add a join from users and signatures
// not null means they have singed, => redirect to thank you
exports.byEmail = email => {
    return db
        .query(
            `SELECT users.id, first, last, pass,  signatures.id AS sig_id
            FROM users
            LEFT JOIN signatures
            ON  signatures.user_id = users.id
        WHERE email=$1`,
            [email]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.createSign = (sig, user_id) => {
    return db
        .query(
            `INSERT INTO  signatures (sig, user_id)
    VALUES ($1, $2)
    RETURNING *`,
            [sig || null, user_id]
        )
        .then(function(results) {
            return results.rows;
        });
};
//render signature on thank you page: users.id, first, last, pass, signatures.user_id AS sig
exports.getSig = id => {
    return db
        .query(
            `SELECT users.id, first, last, signatures.id AS sig_id, sig
            FROM signatures
            FULL OUTER JOIN users
            ON signatures.user_id = users.id
            WHERE users.id=$1`,
            [id]
        )
        .then(function(results) {
            return results.rows;
        });
};

//signatures.first,signatures.last,user_profiles.age,user_profiles.city,user_profiles.url
exports.listSignature = () => {
    return db
        .query(
            `SELECT * FROM  signatures
        LEFT OUTER JOIN user_profiles
    ON  user_profiles.user_id = signatures.user_id
    JOIN users
    ON users.id=signatures.user_id`
        )
        .then(function(results) {
            return results.rows;
        });
};
exports.listSignatureByCity = city => {
    return db
        .query(
            `SELECT * FROM  signatures
        LEFT OUTER JOIN user_profiles
    ON  user_profiles.user_id = signatures.user_id
    JOIN users ON
     users.id = signatures.user_id
    WHERE LOWER (user_profiles.city)= LOWER($1);`,
            [city]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.listProfileInfo = UserID => {
    return db
        .query(
            `SELECT * FROM  users
        FUll OUTER JOIN user_profiles
    ON  user_profiles.user_id = users.id
    WHERE users.id=$1`,
            [UserID]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.updateProfileInfoPass = (id, first, last, email, hash) => {
    return db
        .query(
            `UPDATE users
SET first = $2, last = $3, email = $4, pass= $5
WHERE id = $1`,
            [id, first, last, email, hash]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.updateProfileInfo = (id, first, last, email) => {
    return db
        .query(
            `UPDATE users
SET first = $2, last = $3, email = $4
WHERE id = $1`,
            [id, first, last, email]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.upsertUserProfiles = (age, city, url, user_id) => {
    return db
        .query(
            `INSERT INTO user_profiles (age, city, url,user_id)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city=$2, url= $3`,
            [age || null, city || null, url || null, user_id]
        )
        .then(function(results) {
            return results.rows;
        });
};

exports.deleteSignature = id => {
    return db
        .query(`DELETE FROM signatures WHERE user_id =$1`, [id])
        .then(function(results) {
            return results.rows;
        });
};

exports.deleteUserProfile = id => {
    return db
        .query(`DELETE FROM user_profiles WHERE user_id =$1`, [id])
        .then(function(results) {
            return results.rows;
        });
};

exports.deleteUser = id => {
    return db
        .query(`DELETE FROM users WHERE id =$1`, [id])
        .then(function(results) {
            return results.rows;
        });
};
