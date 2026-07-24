package com.lifewallet.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class LifeWalletApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(LifeWalletApiApplication.class, args);
    }
}
