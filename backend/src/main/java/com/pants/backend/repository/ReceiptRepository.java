package com.pants.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.pants.backend.entity.Receipt;

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {

}
