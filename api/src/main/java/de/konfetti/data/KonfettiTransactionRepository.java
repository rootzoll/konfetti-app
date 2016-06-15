package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KonfettiTransactionRepository extends JpaRepository<KonfettiTransaction, Long> {

	List<KonfettiTransaction> findByFromAccountOrToAccount(String fromAccount, String toAccount);

	List<KonfettiTransaction> findByFromAccountAndTimestampGreaterThan(String fromAccount, Long time);

	List<KonfettiTransaction> findByToAccountAndTimestampGreaterThan(String toAccount, Long time);
}
