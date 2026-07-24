package com.lifewallet.api.data;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DataManagementService {

    private final JdbcTemplate jdbcTemplate;

    public DataManagementService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void deleteOwnerData(String ownerKey) {
        // 未开户的用户也可能已经使用 Agent，因此先按 owner_key 独立删除对话。
        jdbcTemplate.update("DELETE FROM agent_conversation WHERE owner_key = ?", ownerKey);
        // 账户外键会级联删除记录、活动、汇总和两类反馈。
        jdbcTemplate.update("DELETE FROM life_account WHERE owner_key = ?", ownerKey);
    }
}
