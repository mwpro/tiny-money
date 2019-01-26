package com.mwpro.tinymoney.models;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Set;

@Entity
@EntityListeners(AuditingEntityListener.class)
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    @NotNull
    private String name;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "transaction_tag",
            joinColumns = { @JoinColumn(name = "tag_id") },
            inverseJoinColumns = { @JoinColumn(name = "transaction_id") })
    private Set<Transaction> transactions;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(Set<Transaction> transactions) {
        this.transactions = transactions;
    }
}
