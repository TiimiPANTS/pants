package com.pants.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;

public interface TableListRepository
        extends JpaRepository<TableList, TableListId> {
}