package de.konfetti.service;

import de.konfetti.data.Code;
import de.konfetti.data.CodeRepository;
import org.junit.Before;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

/**
 * Created by relampago on 05.03.16.
 */
public class CodeServiceTest extends BaseTest {

    // TODO: should be retrieved from database
    public static final Long PARTY_ID = new Long(1);
    public static final Long USER_ID = new Long(1);
    public static final Long KONFETTI_AMOUNT = new Long(1000);

    @Autowired
    private CodeRepository codeRepository;

    private CodeService codeService;

    @Before
    public void setUp() throws Exception {
        codeService = new CodeServiceImpl(codeRepository);
        codeRepository.deleteAll();
    }

    @Test
    public void testCreateKonfettiCoupon() throws Exception {
        Code createdCode = codeService.createKonfettiCoupon(PARTY_ID, USER_ID, KONFETTI_AMOUNT);

        // verify that the code was created in database correctly
        Code persistedCode = codeService.findByCode(createdCode.getCode());
        assertEquals("partyId persited", PARTY_ID, persistedCode.getPartyID());
        assertEquals("userId persited", USER_ID, persistedCode.getUserID());
        assertEquals("konfettiAmount persited", KONFETTI_AMOUNT, persistedCode.getAmount());
        assertEquals("actionType persited", Code.ACTION_TYPE_KONFETTI, persistedCode.getActionType());
        assertEquals("code persited", createdCode.getCode(), persistedCode.getCode());
        // NotNUll : persistedCode.getTimestamp()
    }

    @Test
    public void testCreateAdminCode() throws Exception {
        Code createdCode = codeService.createAdminCode(PARTY_ID);

        // verify that the code was created in database correctly
        Code persistedCode = codeService.findByCode(createdCode.getCode());
        assertEquals("partyId persited", PARTY_ID, persistedCode.getPartyID());
        assertNull("userId is Null", persistedCode.getUserID());
        assertNull("konfettiAmount is Null", persistedCode.getAmount());
        assertEquals("actionType persited", Code.ACTION_TYPE_ADMIN, persistedCode.getActionType());
        assertEquals("code persited", createdCode.getCode(), persistedCode.getCode());
    }

    @Test
    public void testCreateReviewCode() throws Exception {
        Code createdCode = codeService.createReviewCode(PARTY_ID);

        // verify that the code was created in database correctly
        Code persistedCode = codeService.findByCode(createdCode.getCode());
        assertEquals("partyId persited", PARTY_ID, persistedCode.getPartyID());
        assertNull("userId is Null", persistedCode.getUserID());
        assertNull("konfettiAmount is Null", persistedCode.getAmount());
        assertEquals("actionType persited", Code.ACTION_TYPE_REVIEWER, persistedCode.getActionType());
        assertEquals("code persited", createdCode.getCode(), persistedCode.getCode());
    }

    @Test
    public void testRedeemByCode() throws Exception {
        Code createdCode = codeService.createKonfettiCoupon(PARTY_ID, USER_ID, KONFETTI_AMOUNT);

        Code redeemedCode = codeService.redeemByCode(createdCode.getCode());

        // verify that the code returned is the correct one
        assertEquals("partyId persited", PARTY_ID, redeemedCode.getPartyID());
        assertEquals("userId persited", USER_ID, redeemedCode.getUserID());
        assertEquals("konfettiAmount persited", KONFETTI_AMOUNT, redeemedCode.getAmount());
        assertEquals("actionType persited", Code.ACTION_TYPE_KONFETTI, redeemedCode.getActionType());
        assertEquals("code persited", createdCode.getCode(), redeemedCode.getCode());

        // verfiy the code does not exist anymore in the database
        Code notExisting = codeService.findByCode(createdCode.getCode());
        assertNull("Coupon is deleted", notExisting);
    }
}