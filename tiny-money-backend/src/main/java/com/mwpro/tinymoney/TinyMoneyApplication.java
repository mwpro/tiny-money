package com.mwpro.tinymoney;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class TinyMoneyApplication {

    public static void main(String[] args) {
        SpringApplication.run(TinyMoneyApplication.class, args);
    }

}

