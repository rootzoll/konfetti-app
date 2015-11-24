package de.konfetti.controller;

import de.konfetti.data.User;
import de.konfetti.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by catarata02 on 08.11.15.
 */
@CrossOrigin(maxAge = 3600)
@RestController
@RequestMapping("konfetti/api/account")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(final UserService userService) {
        this.userService = userService;
    }

    //---------------------------------------------------
    // USER Controller
    //---------------------------------------------------
    @RequestMapping(method = RequestMethod.GET, produces = "application/json")
    public User createUser(){
//        return "test1234";
        return userService.create();
    }


}
