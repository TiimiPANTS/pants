package com.pants.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;

public interface TableListRepository
        extends JpaRepository<TableList, TableListId> {

    List<TableList> findByIdTableId(Integer tableId);
}