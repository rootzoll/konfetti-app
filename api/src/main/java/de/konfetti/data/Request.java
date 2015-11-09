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



}
