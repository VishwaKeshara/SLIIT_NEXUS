package com.sliit.nexus.repository;

import com.sliit.nexus.model.Booking;
import com.sliit.nexus.model.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserId(String userId);
    List<Booking> findByResourceIdAndDateAndStatusNot(String resourceId, LocalDate date, BookingStatus status);
}
