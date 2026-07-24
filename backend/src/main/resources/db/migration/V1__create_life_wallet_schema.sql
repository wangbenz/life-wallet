-- Life Wallet 首版持久化结构。
-- 业务数据必须归属 owner_key；当前未登录 H5 后续使用安装级随机标识，不以生日等隐私字段充当身份。
CREATE TABLE life_account (
    account_id BIGINT NOT NULL AUTO_INCREMENT,
    owner_key VARCHAR(64) NOT NULL,
    birthday DATE NOT NULL,
    expected_life_years SMALLINT NOT NULL,
    row_version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (account_id),
    CONSTRAINT uk_life_account_owner_key UNIQUE (owner_key),
    CONSTRAINT ck_life_account_expected_years CHECK (expected_life_years BETWEEN 1 AND 120)
);

CREATE TABLE life_record (
    record_id BIGINT NOT NULL AUTO_INCREMENT,
    account_id BIGINT NOT NULL,
    life_date DATE NOT NULL,
    original_content VARCHAR(2000) NOT NULL,
    record_status VARCHAR(24) NOT NULL,
    intent VARCHAR(40) NOT NULL,
    summary VARCHAR(1000) NOT NULL,
    needs_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
    row_version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (record_id),
    CONSTRAINT fk_life_record_account FOREIGN KEY (account_id)
        REFERENCES life_account (account_id) ON DELETE CASCADE,
    CONSTRAINT ck_life_record_status CHECK (record_status IN ('DRAFT', 'ANALYZED', 'CONFIRMED', 'DELETED'))
);

CREATE INDEX idx_life_record_account_date
    ON life_record (account_id, life_date, created_at);

CREATE INDEX idx_life_record_account_created
    ON life_record (account_id, created_at);

CREATE TABLE life_activity (
    activity_id BIGINT NOT NULL AUTO_INCREMENT,
    record_id BIGINT NOT NULL,
    activity_position SMALLINT NOT NULL,
    title VARCHAR(120) NOT NULL,
    source_text VARCHAR(2000),
    duration_minutes SMALLINT NOT NULL,
    life_dimension VARCHAR(32) NOT NULL,
    domain_name VARCHAR(64) NOT NULL,
    topic VARCHAR(120) NOT NULL,
    is_estimated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (activity_id),
    CONSTRAINT fk_life_activity_record FOREIGN KEY (record_id)
        REFERENCES life_record (record_id) ON DELETE CASCADE,
    CONSTRAINT uk_life_activity_position UNIQUE (record_id, activity_position),
    CONSTRAINT ck_life_activity_position CHECK (activity_position BETWEEN 0 AND 19),
    CONSTRAINT ck_life_activity_duration CHECK (duration_minutes BETWEEN 1 AND 1440),
    CONSTRAINT ck_life_activity_dimension CHECK (
        life_dimension IN ('成长', '创造', '关系', '健康', '生活', '休闲', '睡眠')
    )
);

CREATE TABLE life_dimension_summary (
    record_id BIGINT NOT NULL,
    life_dimension VARCHAR(32) NOT NULL,
    duration_minutes INT NOT NULL,
    PRIMARY KEY (record_id, life_dimension),
    CONSTRAINT fk_dimension_summary_record FOREIGN KEY (record_id)
        REFERENCES life_record (record_id) ON DELETE CASCADE,
    CONSTRAINT ck_dimension_summary_duration CHECK (duration_minutes BETWEEN 0 AND 28800),
    CONSTRAINT ck_dimension_summary_dimension CHECK (
        life_dimension IN ('成长', '创造', '关系', '健康', '生活', '休闲', '睡眠')
    )
);

CREATE TABLE record_feedback (
    feedback_id BIGINT NOT NULL AUTO_INCREMENT,
    record_id BIGINT NOT NULL,
    accuracy VARCHAR(24) NOT NULL,
    comment_text VARCHAR(1000),
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (feedback_id),
    CONSTRAINT uk_record_feedback_record UNIQUE (record_id),
    CONSTRAINT fk_record_feedback_record FOREIGN KEY (record_id)
        REFERENCES life_record (record_id) ON DELETE CASCADE,
    CONSTRAINT ck_record_feedback_accuracy CHECK (accuracy IN ('ACCURATE', 'PARTIAL', 'INACCURATE'))
);

CREATE INDEX idx_record_feedback_record_created
    ON record_feedback (record_id, created_at);

CREATE TABLE experience_feedback (
    feedback_id BIGINT NOT NULL AUTO_INCREMENT,
    account_id BIGINT NOT NULL,
    feedback_text VARCHAR(2000) NOT NULL,
    source_page VARCHAR(32) NOT NULL DEFAULT 'ME',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (feedback_id),
    CONSTRAINT fk_experience_feedback_account FOREIGN KEY (account_id)
        REFERENCES life_account (account_id) ON DELETE CASCADE
);

CREATE INDEX idx_experience_feedback_account_created
    ON experience_feedback (account_id, created_at);

CREATE TABLE agent_conversation (
    conversation_id VARCHAR(80) NOT NULL,
    owner_key VARCHAR(64) NOT NULL,
    account_id BIGINT,
    active_life_date DATE,
    last_record_id BIGINT,
    conversation_status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (conversation_id),
    CONSTRAINT fk_agent_conversation_account FOREIGN KEY (account_id)
        REFERENCES life_account (account_id) ON DELETE CASCADE,
    CONSTRAINT fk_agent_conversation_last_record FOREIGN KEY (last_record_id)
        REFERENCES life_record (record_id) ON DELETE SET NULL,
    CONSTRAINT ck_agent_conversation_status CHECK (conversation_status IN ('ACTIVE', 'CLOSED'))
);

CREATE INDEX idx_agent_conversation_account_updated
    ON agent_conversation (account_id, updated_at);

CREATE INDEX idx_agent_conversation_owner_updated
    ON agent_conversation (owner_key, updated_at);

-- 每个 client_turn_id 全局唯一，用于网络重试时返回同一结果，避免重复写建议。
CREATE TABLE agent_turn (
    turn_id VARCHAR(80) NOT NULL,
    conversation_id VARCHAR(80) NOT NULL,
    client_turn_id VARCHAR(100) NOT NULL,
    turn_status VARCHAR(32) NOT NULL,
    user_message VARCHAR(2000) NOT NULL,
    assistant_message VARCHAR(4000) NOT NULL,
    record_ids_json TEXT,
    pending_action_type VARCHAR(32),
    pending_action_json TEXT,
    model_name VARCHAR(80),
    duration_ms INT,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (turn_id),
    CONSTRAINT fk_agent_turn_conversation FOREIGN KEY (conversation_id)
        REFERENCES agent_conversation (conversation_id) ON DELETE CASCADE,
    CONSTRAINT uk_agent_turn_client_turn UNIQUE (client_turn_id),
    CONSTRAINT ck_agent_turn_status CHECK (
        turn_status IN ('COMPLETED', 'NEEDS_INPUT', 'NEEDS_CONFIRMATION', 'FAILED')
    ),
    CONSTRAINT ck_agent_turn_duration CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

CREATE INDEX idx_agent_turn_conversation_created
    ON agent_turn (conversation_id, created_at);
