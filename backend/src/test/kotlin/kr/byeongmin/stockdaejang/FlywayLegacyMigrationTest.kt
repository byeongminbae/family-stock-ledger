package kr.byeongmin.stockdaejang

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.testcontainers.postgresql.PostgreSQLContainer
import java.sql.DriverManager
import kotlin.test.assertEquals
import kotlin.test.assertNull

class FlywayLegacyMigrationTest {
    @Test
    fun `identity 시퀀스가 없는 레거시 소유주 스키마를 마이그레이션한다`() {
        val postgres = PostgreSQLContainer("postgres:17-alpine")
        postgres.start()

        try {
            flyway(postgres, target = "1").migrate()
            DriverManager.getConnection(postgres.jdbcUrl, postgres.username, postgres.password).use { connection ->
                connection.createStatement().use { statement ->
                    statement.execute("ALTER TABLE owners ALTER COLUMN id DROP IDENTITY")
                }
            }

            flyway(postgres).migrate()

            DriverManager.getConnection(postgres.jdbcUrl, postgres.username, postgres.password).use { connection ->
                connection.createStatement().use { statement ->
                    statement.executeQuery(
                        "SELECT data_type FROM information_schema.columns " +
                            "WHERE table_schema = 'public' AND table_name = 'owners' AND column_name = 'id'",
                    ).use { resultSet ->
                        resultSet.next()
                        assertEquals("bigint", resultSet.getString("data_type"))
                    }
                    statement.executeQuery("SELECT pg_get_serial_sequence('public.owners', 'id')").use { resultSet ->
                        resultSet.next()
                        assertNull(resultSet.getString(1))
                    }
                }
            }
        } finally {
            postgres.stop()
        }
    }

    private fun flyway(postgres: PostgreSQLContainer, target: String? = null): Flyway {
        val configuration = Flyway.configure()
            .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
        if (target != null) {
            configuration.target(target)
        }
        return configuration.load()
    }
}
