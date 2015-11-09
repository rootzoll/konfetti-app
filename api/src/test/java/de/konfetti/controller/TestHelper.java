package de.konfetti.controller;

import de.konfetti.data.Party;
import de.konfetti.data.Request;

import java.util.Date;

public class TestHelper {
    public TestHelper() {
    }

    public Party getTestParty1() {
        Party testParty =  new Party();
        testParty.setName("testParty1");
        testParty.setAddress("testAddress1");
        testParty.setLat(new Float("0.0"));
        testParty.setLon(new Float("0.0"));
        return  testParty;
    }

    public Party getTestParty2() {
        Party testParty =  new Party();
        testParty.setName("testParty2");
        testParty.setAddress("testAddress2");
        testParty.setLat(new Float("0.0"));
        testParty.setLon(new Float("0.0"));
        return  testParty;

    }

    public Request getTestRequest1(Party party){
        Request request = new Request();
        request.setParty(party);
        request.setTitle("testPartyTitle1");
        request.setImageUrl("testPartyImageUrl1");
        request.setKonfettiAdd(10);
        request.setKonfettiCount(20);
        request.setTime(new Date());
        return request;
    }


    public boolean equalPartys(Party actual, Party expected) {
        if (actual.getName() != null ? !actual.getName().equals(expected.getName()) : expected.getName() != null) return false;
        if (actual.getAddress() != null ? !actual.getAddress().equals(expected.getAddress()) : expected.getAddress() != null) return false;
        return !(actual.getPerson() != null ? !actual.getPerson().equals(expected.getPerson()) : expected.getPerson() != null);
    }

    public boolean equalRequests(Request actual, Request expected){
        if (actual.getKonfettiCount() != expected.getKonfettiCount()) return false;
        if (actual.getKonfettiAdd() != expected.getKonfettiAdd()) return false;
        if (actual.getParty() != null ? !actual.getParty().getId().equals(expected.getParty().getId()) : expected.getParty() != null) return false;
//        if (actual.getTime() != null ? !actual.getTime().equals(expected.getTime()) : expected.getTime() != null) return false;
        if (actual.getTitle() != null ? !actual.getTitle().equals(expected.getTitle()) : expected.getTitle() != null) return false;
        return !(actual.getImageUrl() != null ? !actual.getImageUrl().equals(expected.getImageUrl()) : expected.getImageUrl() != null);
    }

}