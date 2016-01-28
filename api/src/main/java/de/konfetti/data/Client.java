package de.konfetti.data;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;
/*
 * There can be multiple clients connected to one user.
 * A client can be an App install or a browser session.
 */
@Entity
public class Client {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // every client belongs to one user
    private Long userId;
    
    // every client of a user has a different secret for authentification
    private String secret;
        
    /*
     * METHODS 
     */
    
    @JsonProperty("clientId")
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }
}

