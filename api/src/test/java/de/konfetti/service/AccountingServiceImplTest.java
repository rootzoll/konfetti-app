package de.konfetti.service;

import de.konfetti.data.Account;
import de.konfetti.data.AccountRepository;
import de.konfetti.data.CodeRepository;
import de.konfetti.data.KonfettiTransactionRepository;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.Assert.*;

/**
 * Created by relampago on 05.03.16.
 */
public class AccountingServiceImplTest extends BaseTest {

    public static final String TEST_ACCOUNT_NAME = "testAccount";
    private AccountingService accountingService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private KonfettiTransactionRepository konfettiTransactionRepository;

    @Before
    public void setUp() throws Exception {
        accountingService = new AccountingServiceImpl(accountRepository, konfettiTransactionRepository);
        accountRepository.deleteAll();
        konfettiTransactionRepository.deleteAll();
    }


    @Ignore
    @Test
    public void testGetBalanceOfAccount() throws Exception {

    }

    @Test
    public void testCreateAccount() throws Exception {
        boolean createdAccount = accountingService.createAccount(TEST_ACCOUNT_NAME);
        assertTrue("account crated", createdAccount);

        // find created account
        Account persistedAccount = accountingService.findAccountByName(TEST_ACCOUNT_NAME);
        assertEquals("account Persisted", TEST_ACCOUNT_NAME, persistedAccount.getName());
    }

    @Test
    public void testDeleteAccount() throws Exception {
        accountingService.createAccount(TEST_ACCOUNT_NAME);

        boolean deleted = accountingService.deleteAccount(TEST_ACCOUNT_NAME);
        assertTrue("account deleted successfully", deleted);

        // verify the account does not exist anymore
        Account account = accountingService.findAccountByName(TEST_ACCOUNT_NAME);
        assertNull("account not in database anymore", account);
    }

    @Ignore
    @Test
    public void testTransfereBetweenAccounts() throws Exception {

    }

    @Ignore
    @Test
    public void testAddBalanceToAccount() throws Exception {

    }

    @Ignore
    @Test
    public void testRemoveBalanceFromAccount() throws Exception {

    }
}