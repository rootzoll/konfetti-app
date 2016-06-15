package de.konfetti.data;

import de.konfetti.service.BaseTest;
import lombok.val;
import org.hamcrest.MatcherAssert;
import org.hamcrest.Matchers;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Initially created by Tino on 15.06.16.
 */
public class KonfettiTransactionRepositoryTest extends BaseTest {


	@Autowired
	private KonfettiTransactionRepository konfettiTransactionRepository;

	@Test
	public void findByFromAccountOrToAccount() throws Exception {
		val first = konfettiTransactionRepository.save(new KonfettiTransaction(1L, "test1", "test2"));
		val second = konfettiTransactionRepository.save(new KonfettiTransaction(1L, "test2", "test1"));
		konfettiTransactionRepository.save(new KonfettiTransaction(1L, "test3", "test2"));
		konfettiTransactionRepository.save(new KonfettiTransaction(1L, "test2", "test3"));
		val result = konfettiTransactionRepository.findByFromAccountOrToAccount("test1", "test1");
		MatcherAssert.assertThat(result, Matchers.contains(first, second));
	}

}