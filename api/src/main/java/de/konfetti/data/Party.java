package de.konfetti.data;

import javax.persistence.*;
import java.util.Set;

/**
 * Created by catarata02 on 08.11.15.
 */
@Entity
public class Party {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String town;

    private String address;

    private Float lon;

    private Float lat;

    private int meters;

    private String person;

    private String website;

    private int konfettiCount;

    private int konfettiTotal;

    private int topClass;

    @OneToMany(mappedBy="party")
    private Set<Request> requestSet;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTown() {
        return town;
    }

    public void setTown(String town) {
        this.town = town;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Float getLon() {
        return lon;
    }

    public void setLon(Float lon) {
        this.lon = lon;
    }

    public Float getLat() {
        return lat;
    }

    public void setLat(Float lat) {
        this.lat = lat;
    }

    public int getMeters() {
        return meters;
    }

    public void setMeters(int meters) {
        this.meters = meters;
    }

    public String getPerson() {
        return person;
    }

    public void setPerson(String person) {
        this.person = person;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public int getKonfettiCount() {
        return konfettiCount;
    }

    public void setKonfettiCount(int konfettiCount) {
        this.konfettiCount = konfettiCount;
    }

    public int getKonfettiTotal() {
        return konfettiTotal;
    }

    public void setKonfettiTotal(int konfettiTotal) {
        this.konfettiTotal = konfettiTotal;
    }

    public int getTopClass() {
        return topClass;
    }

    public void setTopClass(int topClass) {
        this.topClass = topClass;
    }

    public Set<Request> getRequestSet() {
        return requestSet;
    }

    public void setRequestSet(Set<Request> requestSet) {
        this.requestSet = requestSet;
    }
}
