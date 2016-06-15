package de.konfetti.data;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

/*
 * special class just to externalize the accounting of all objects related to carry value
 * 
 * every account has a name and a balance
 * so e.g. a user on a party maps to a unique account name
 * or an request can have an account while collection value
 * 
 * the accounting should not be done on those objects - thats what the seperated accounting services are for
 * 
 */
@Data
@Entity
public class Account {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
	// name of the account ---> TODO: create transaction secure index
    private String name;
    
    // the actual balance of the account
	private Long balance = 0L;

	public void addBalance(Long balance) {
		this.balance = this.balance + balance;
	}
	
	public void removeBalance(Long balance) {
		this.balance = this.balance - balance;
	}
    
}

