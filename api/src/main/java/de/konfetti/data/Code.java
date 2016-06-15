package de.konfetti.data;

import lombok.Data;

import javax.persistence.*;
import java.util.Random;

@Data
@Entity
public class Code {

	public static final int ACTION_TYPE_KONFETTI = 0;
	public static final int ACTION_TYPE_ADMIN = 1;
	public static final int ACTION_TYPE_REVIEWER = 2;
	private static Random randomGenerator = new Random();
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
	// the time of creation
    private Long timestamp;
    
    // the party the code belongs to
    private Long partyID;
    
    // creator of coupon
    private Long userID;
    
    // the code of the coupon - normally just a number - but could be also string
    @Column(unique=true)
    private String code;
    
    // what kind of action is behind this 
    private int actionType = ACTION_TYPE_KONFETTI;
    
    // amount of konfetti (when actionType => 0)
    private Long amount;
	
    /*
     * UTIL
     */
    
    public static Long generadeCodeNumber() {
    	long rand = randomGenerator.nextLong();
    	if (rand<0) rand = -rand;
    	return ( rand % 8999999999l) + 1000000000l;
    }

	public static void main(String[] args) {
		for (int i=0; i<1000; i++) {
			System.out.println(generadeCodeNumber());
		}
	}
}
