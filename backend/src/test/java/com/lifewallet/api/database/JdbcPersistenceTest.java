package com.lifewallet.api.database;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;

import com.lifewallet.api.account.AccountRequest;
import com.lifewallet.api.account.AccountResponse;
import com.lifewallet.api.account.AccountService;
import com.lifewallet.api.agent.chat.AgentChatResponse;
import com.lifewallet.api.agent.chat.AgentConversationPersistence;
import com.lifewallet.api.agent.chat.AgentServiceException;
import com.lifewallet.api.agent.chat.PendingActionResponse;
import com.lifewallet.api.record.RecordRequest;
import com.lifewallet.api.record.RecordResponse;
import com.lifewallet.api.record.RecordService;
import com.lifewallet.api.data.DataManagementService;
import com.lifewallet.api.agent.AgentActivity;
import com.lifewallet.api.agent.DimensionSummary;
import com.lifewallet.api.feedback.ExperienceFeedbackRequest;
import com.lifewallet.api.feedback.FeedbackService;
import com.lifewallet.api.feedback.RecordFeedbackRequest;
import com.lifewallet.api.record.ConfirmRecordRequest;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class JdbcPersistenceTest {

    @Autowired
    private AccountService accountService;

    @Autowired
    private RecordService recordService;

    @Autowired
    private AgentConversationPersistence conversationStore;

    @Autowired
    private DataManagementService dataManagementService;

    @Autowired
    private FeedbackService feedbackService;

    @Test
    void accountAndAnalyzedRecordRemainAvailableThroughJdbcStores() {
        String ownerKey = "jdbc_owner_account";
        AccountResponse created = accountService.saveAccount(
                ownerKey,
                new AccountRequest(LocalDate.of(1995, 1, 1), 80)
        );
        AccountResponse updated = accountService.saveAccount(
                ownerKey,
                new AccountRequest(LocalDate.of(1995, 1, 2), 85)
        );
        assertThat(updated.accountId()).isEqualTo(created.accountId());
        assertThat(accountService.getAccount(ownerKey).expectedLifeYears()).isEqualTo(85);

        RecordResponse saved = recordService.createRecord(
                ownerKey,
                new RecordRequest(LocalDate.now(), "今天写代码 2 小时")
        );
        assertThat(saved.activities()).isNotEmpty();
        assertThat(recordService.getRecentRecords(ownerKey))
                .extracting(RecordResponse::recordId)
                .contains(saved.recordId());
    }

    @Test
    void agentTurnIsIdempotentAndIsolatedByOwner() {
        String ownerKey = "jdbc_owner_agent";
        AgentConversationPersistence.ConversationState conversation = conversationStore.getOrCreate(ownerKey, null);
        conversation.append("user", "我今天记了什么？");
        conversation.append("assistant", "今天还没有已确认记录。");
        AgentChatResponse response = new AgentChatResponse(
                conversation.conversationId(),
                "turn_jdbc_store",
                "COMPLETED",
                "今天还没有已确认记录。",
                List.of(),
                null
        );
        conversation.remember("client_turn_jdbc_store", response);

        assertThat(conversationStore.findResponse(ownerKey, "client_turn_jdbc_store"))
                .contains(response);
        assertThat(conversationStore.getOrCreate(ownerKey, conversation.conversationId()).recentMessages())
                .extracting(message -> message.get("role"))
                .containsExactly("user", "assistant");
        assertThat(conversationStore.findResponse("another_owner", "client_turn_jdbc_store")).isEmpty();
        assertThatThrownBy(() -> conversationStore.getOrCreate("another_owner", conversation.conversationId()))
                .isInstanceOf(AgentServiceException.class)
                .hasMessage("这段对话不存在，请重新开始。");
    }

    @Test
    void pendingActionRoundTripsAsStructuredJson() {
        String ownerKey = "jdbc_owner_pending";
        AgentConversationPersistence.ConversationState conversation = conversationStore.getOrCreate(ownerKey, null);
        conversation.append("user", "记下今天散步 30 分钟");
        conversation.append("assistant", "确认后才会保存。" );
        AgentChatResponse response = new AgentChatResponse(
                conversation.conversationId(),
                "turn_jdbc_pending",
                "NEEDS_CONFIRMATION",
                "确认后才会保存。",
                List.of(),
                PendingActionResponse.create(LocalDate.now(), "今天散步 30 分钟")
        );
        conversation.remember("client_turn_jdbc_pending", response);

        assertThat(conversationStore.findResponse(ownerKey, "client_turn_jdbc_pending"))
                .contains(response);
    }

    @Test
    void deletingOwnerDataRemovesAccountRecordsAndAgentTurns() {
        String ownerKey = "jdbc_owner_delete";
        accountService.saveAccount(ownerKey, new AccountRequest(LocalDate.of(1990, 1, 1), 80));
        recordService.createRecord(ownerKey, new RecordRequest(LocalDate.now(), "今天散步 30 分钟"));
        AgentConversationPersistence.ConversationState conversation = conversationStore.getOrCreate(ownerKey, null);
        conversation.append("user", "我今天记了什么？");
        conversation.append("assistant", "今天记录了散步。" );
        conversation.remember("client_turn_jdbc_delete", new AgentChatResponse(
                conversation.conversationId(), "turn_jdbc_delete", "COMPLETED", "今天记录了散步。", List.of(), null
        ));

        dataManagementService.deleteOwnerData(ownerKey);

        assertThatThrownBy(() -> accountService.getAccount(ownerKey)).hasMessage("还没有创建人生账户。");
        assertThat(recordService.getRecentRecords(ownerKey)).isEmpty();
        assertThat(conversationStore.findResponse(ownerKey, "client_turn_jdbc_delete")).isEmpty();
    }

    @Test
    void confirmedRecordCanBeUpdatedDeletedAndRated() {
        String ownerKey = "jdbc_owner_confirm";
        accountService.saveAccount(ownerKey, new AccountRequest(LocalDate.of(1990, 1, 1), 80));
        ConfirmRecordRequest create = new ConfirmRecordRequest(
                null, LocalDate.now(), "今天工作 2 小时", "今天主要投入在创造上。",
                List.of(new AgentActivity("工作", 120, "创造", "工作", "工作", false)),
                List.of(new DimensionSummary("创造", 120)), false
        );
        RecordResponse saved = recordService.confirmRecord(ownerKey, create);
        RecordResponse updated = recordService.confirmRecord(ownerKey, new ConfirmRecordRequest(
                saved.recordId(), LocalDate.now(), "今天工作 8 小时", "今天主要投入在创造上。",
                List.of(new AgentActivity("工作", 480, "创造", "工作", "工作", false)),
                List.of(new DimensionSummary("创造", 480)), false
        ));
        assertThat(updated.recordId()).isEqualTo(saved.recordId());
        assertThat(updated.activities().getFirst().durationMinutes()).isEqualTo(480);

        assertThat(feedbackService.saveRecordFeedback(ownerKey, new RecordFeedbackRequest(saved.recordId(), "accurate")).rating())
                .isEqualTo("accurate");
        assertThat(feedbackService.saveExperienceFeedback(ownerKey, new ExperienceFeedbackRequest("整体流程清晰")).content())
                .isEqualTo("整体流程清晰");

        recordService.deleteRecord(ownerKey, saved.recordId());
        assertThat(recordService.getRecentRecords(ownerKey)).isEmpty();
    }
}
