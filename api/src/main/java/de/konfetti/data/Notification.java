package de.konfetti.data;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

import static de.konfetti.data.NotificationType.REWARD_GOT;

@Entity
@Data
public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // every notification belongs to one user
    private Long userId;
    
    // >0 if belonging to a party
    private Long partyId;
    
    // type (see CONST above)
	private NotificationType type;

	// reference - depending on type
    private Long ref;
    
    // time stamp of creation
	private Long timeStamp;

	private Boolean higherPushDone = Boolean.FALSE;

    /*
     * METHODS 
     */
    
	public boolean needsManualDeletion() {
		return REWARD_GOT.equals(this.type);
	}

}

