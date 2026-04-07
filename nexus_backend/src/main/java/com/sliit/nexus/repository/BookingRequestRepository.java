package com.sliit.nexus.repository;

import com.sliit.nexus.model.BookingRequest;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BookingRequestRepository extends MongoRepository<BookingRequest, String> {
    List<BookingRequest> findByRequestedByUserIdOrderByCreatedAtDesc(String requestedByUserId);
}
