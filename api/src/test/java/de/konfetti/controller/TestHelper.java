package de.konfetti.controller;

import de.konfetti.data.Party;

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


    public boolean equalPartys(Party actual, Party expected) {
        if (actual.getName() != null ? !actual.getName().equals(expected.getName()) : expected.getName() != null) return false;
        if (actual.getAddress() != null ? !actual.getAddress().equals(expected.getAddress()) : expected.getAddress() != null) return false;
        return !(actual.getPerson() != null ? !actual.getPerson().equals(expected.getPerson()) : expected.getPerson() != null);
    }

}