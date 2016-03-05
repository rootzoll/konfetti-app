package de.konfetti.service;

import de.konfetti.data.Code;

public interface CodeService {

    Code createKonfettiCoupon(Long partyID, Long userID, Long konfettiAmount);
    
    Code createAdminCode(Long partyID);
    
    Code createReviewCode(Long partyID);

    // returns null if code is not valid
    Code redeemByCode(String code);
}