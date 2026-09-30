export const schemaVersion = 2

export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS n13_app_users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    google_sub VARCHAR(255) NULL UNIQUE,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    display_name VARCHAR(200) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS n13_sessions (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_n13_sessions_user FOREIGN KEY (user_id) REFERENCES n13_app_users(id) ON DELETE CASCADE,
    INDEX idx_n13_sessions_user (user_id),
    INDEX idx_n13_sessions_expiry (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS n13_simulations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    service_id VARCHAR(32) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    barber_id VARCHAR(32) NOT NULL,
    barber_name VARCHAR(100) NOT NULL,
    day_id VARCHAR(8) NOT NULL,
    day_date DATE NOT NULL,
    day_label VARCHAR(32) NOT NULL,
    day_number VARCHAR(2) NOT NULL,
    start_time CHAR(5) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_n13_simulations_user FOREIGN KEY (user_id) REFERENCES n13_app_users(id) ON DELETE CASCADE,
    INDEX idx_n13_simulations_user_created (user_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
]
