package com.sliit.nexus.controller;

import com.sliit.nexus.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class RootController {

    private final AppProperties appProperties;

    @GetMapping("/")
    public String redirectToFrontend() {
        return "redirect:" + appProperties.frontendUrl();
    }
}
