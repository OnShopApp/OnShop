CREATE TABLE IF NOT EXISTS projects
(
    id      INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name    VARCHAR(255) NOT NULL,
    description TEXT,

    UNIQUE (name)
);