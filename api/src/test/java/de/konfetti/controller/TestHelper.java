package de.konfetti.controller;

import de.konfetti.data.Code;
import de.konfetti.data.Party;
import de.konfetti.data.Request;

import java.util.Date;

public class TestHelper {
	
    public TestHelper() {
    }

    public Party getTestParty1() {
        Party testParty =  new Party();
        testParty.setName("testParty1");
        testParty.setLat(new Float("0.0"));
        testParty.setLon(new Float("0.0"));
        return  testParty;
    }

    public Party getTestParty2() {
        Party testParty =  new Party();
        testParty.setName("testParty2");
        testParty.setLat(new Float("0.0"));
        testParty.setLon(new Float("0.0"));
        return  testParty;

    }

    public Request getTestRequest1(Party party){
        Request request = new Request();
        request.setTitle("testPartyTitle1");
        request.setKonfettiAdd(10);
        request.setKonfettiCount(20);
        request.setPartyId(party.getId());
        return request;
    }

    public Code getTestCodeKonfetti1(long partyId, long userId, String codeString){
        Code code = new Code();
        code.setAmount((long) 1000);
        code.setActionType(Code.ACTION_TYPE_KONFETTI);
        code.setTimestamp(new Date().getTime());
        code.setCode(codeString);
        code.setPartyID(partyId);
        code.setUserID(userId);
        return code;
    }

//    public boolean equalPartys(Party actual, Party expected) {
//        if (actual.getName() != null ? !actual.getName().equals(expected.getName()) : expected.getName() != null) return false;
//        if (actual.getAddress() != null ? !actual.getAddress().equals(expected.getAddress()) : expected.getAddress() != null) return false;
//        return !(actual.getPerson() != null ? !actual.getPerson().equals(expected.getPerson()) : expected.getPerson() != null);
//    }

    public boolean equalRequests(Request actual, Request expected){
        if (actual.getKonfettiCount() != expected.getKonfettiCount()) return false;
        if (actual.getKonfettiAdd() != expected.getKonfettiAdd()) return false;
        // TODO: repair to work again -> link between party and requests
        // if (actual.getPartyId() != expected.getPartyId()) return false;
//        if (actual.getTime() != null ? !actual.getTime().equals(expected.getTime()) : expected.getTime() != null) return false;
        if (actual.getTitle() != null ? !actual.getTitle().equals(expected.getTitle()) : expected.getTitle() != null) return false;
        return !(actual.getImageMediaID() != expected.getImageMediaID());
    }

}