CREATE TABLE roles(
    id_role INT,
    role_name VARCHAR(255),
    PRIMARY KEY (id_role)
);

CREATE TABLE users(
    id_user INT AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    phonenumber VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT DEFAULT 1,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_user),
    FOREIGN KEY (role_id) REFERENCES roles(id_role)
);

INSERT INTO roles (id_role, role_name) VALUES
    (1, 'User'),
    (2, 'Moderator'),
    (3, 'Administrator');
