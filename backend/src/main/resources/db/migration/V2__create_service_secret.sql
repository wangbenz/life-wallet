-- 服务端第三方密钥只保存密文。解密主密钥由部署环境单独保管，不能写入本表。
CREATE TABLE service_secret (
    secret_name VARCHAR(100) NOT NULL,
    encrypted_value VARCHAR(8192) NOT NULL,
    nonce_value VARCHAR(64) NOT NULL,
    algorithm_name VARCHAR(32) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (secret_name)
);
