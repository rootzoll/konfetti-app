package de.konfetti.data;

import javax.persistence.*;
import java.util.Date;

/**
 * Created by catarata02 on 09.11.15.
 */
@Entity
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

//    private User user;

    @ManyToOne
    @JoinColumn(name="PARTY_ID")
    private Party party;

    private Date time;

    private int konfettiCount;

    private int konfettiAdd;

    private String title;

    private String imageUrl;

//    private Enum<RequestState> state;

//    private Set<Chat> chats;

//    private ??? info;


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Party getParty() {
        return party;
    }

    public void setParty(Party party) {
        this.party = party;
    }

    public Date getTime() {
        return time;
    }

    public void setTime(Date time) {
        this.time = time;
    }

    public int getKonfettiCount() {
        return konfettiCount;
    }

    public void setKonfettiCount(int konfettiCount) {
        this.konfettiCount = konfettiCount;
    }

    public int getKonfettiAdd() {
        return konfettiAdd;
    }

    public void setKonfettiAdd(int konfettiAdd) {
        this.konfettiAdd = konfettiAdd;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
