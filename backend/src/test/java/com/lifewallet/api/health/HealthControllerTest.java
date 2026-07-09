package com.lifewallet.api.health;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HealthControllerTest {

    @Test
    void returnsHealthStatus() {
        HealthResponse response = new HealthController().health();

        assertThat(response.status()).isEqualTo("ok");
        assertThat(response.service()).isEqualTo("life-wallet-api");
        assertThat(response.timestamp()).isNotNull();
    }
}
