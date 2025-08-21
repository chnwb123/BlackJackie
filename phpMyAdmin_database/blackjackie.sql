-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3308
-- Generation Time: Aug 10, 2025 at 02:16 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `blackjackie`
--

-- --------------------------------------------------------

--
-- Table structure for table `cards`
--

CREATE TABLE `cards` (
  `id` int(11) NOT NULL,
  `suit` enum('hearts','diamonds','clubs','spades') NOT NULL,
  `rank` enum('A','2','3','4','5','6','7','8','9','10','J','Q','K') NOT NULL,
  `value` int(11) NOT NULL,
  `qr_data` varchar(255) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cards`
--

INSERT INTO `cards` (`id`, `suit`, `rank`, `value`, `qr_data`, `display_name`, `created_at`) VALUES
(1, 'hearts', 'A', 11, 'CARD_HEARTS_A', 'A of Hearts', '2025-08-05 05:05:51'),
(2, 'hearts', '2', 2, 'CARD_HEARTS_2', '2 of Hearts', '2025-08-05 05:05:51'),
(3, 'hearts', '3', 3, 'CARD_HEARTS_3', '3 of Hearts', '2025-08-05 05:05:51'),
(4, 'hearts', '4', 4, 'CARD_HEARTS_4', '4 of Hearts', '2025-08-05 05:05:51'),
(5, 'hearts', '5', 5, 'CARD_HEARTS_5', '5 of Hearts', '2025-08-05 05:05:51'),
(6, 'hearts', '6', 6, 'CARD_HEARTS_6', '6 of Hearts', '2025-08-05 05:05:51'),
(7, 'hearts', '7', 7, 'CARD_HEARTS_7', '7 of Hearts', '2025-08-05 05:05:51'),
(8, 'hearts', '8', 8, 'CARD_HEARTS_8', '8 of Hearts', '2025-08-05 05:05:51'),
(9, 'hearts', '9', 9, 'CARD_HEARTS_9', '9 of Hearts', '2025-08-05 05:05:51'),
(10, 'hearts', '10', 10, 'CARD_HEARTS_10', '10 of Hearts', '2025-08-05 05:05:51'),
(11, 'hearts', 'J', 10, 'CARD_HEARTS_J', 'J of Hearts', '2025-08-05 05:05:51'),
(12, 'hearts', 'Q', 10, 'CARD_HEARTS_Q', 'Q of Hearts', '2025-08-05 05:05:51'),
(13, 'hearts', 'K', 10, 'CARD_HEARTS_K', 'K of Hearts', '2025-08-05 05:05:51'),
(14, 'diamonds', 'A', 11, 'CARD_DIAMONDS_A', 'A of Diamonds', '2025-08-05 05:05:51'),
(15, 'diamonds', '2', 2, 'CARD_DIAMONDS_2', '2 of Diamonds', '2025-08-05 05:05:51'),
(16, 'diamonds', '3', 3, 'CARD_DIAMONDS_3', '3 of Diamonds', '2025-08-05 05:05:51'),
(17, 'diamonds', '4', 4, 'CARD_DIAMONDS_4', '4 of Diamonds', '2025-08-05 05:05:51'),
(18, 'diamonds', '5', 5, 'CARD_DIAMONDS_5', '5 of Diamonds', '2025-08-05 05:05:51'),
(19, 'diamonds', '6', 6, 'CARD_DIAMONDS_6', '6 of Diamonds', '2025-08-05 05:05:51'),
(20, 'diamonds', '7', 7, 'CARD_DIAMONDS_7', '7 of Diamonds', '2025-08-05 05:05:51'),
(21, 'diamonds', '8', 8, 'CARD_DIAMONDS_8', '8 of Diamonds', '2025-08-05 05:05:51'),
(22, 'diamonds', '9', 9, 'CARD_DIAMONDS_9', '9 of Diamonds', '2025-08-05 05:05:51'),
(23, 'diamonds', '10', 10, 'CARD_DIAMONDS_10', '10 of Diamonds', '2025-08-05 05:05:51'),
(24, 'diamonds', 'J', 10, 'CARD_DIAMONDS_J', 'J of Diamonds', '2025-08-05 05:05:51'),
(25, 'diamonds', 'Q', 10, 'CARD_DIAMONDS_Q', 'Q of Diamonds', '2025-08-05 05:05:51'),
(26, 'diamonds', 'K', 10, 'CARD_DIAMONDS_K', 'K of Diamonds', '2025-08-05 05:05:51'),
(27, 'clubs', 'A', 11, 'CARD_CLUBS_A', 'A of Clubs', '2025-08-05 05:05:51'),
(28, 'clubs', '2', 2, 'CARD_CLUBS_2', '2 of Clubs', '2025-08-05 05:05:51'),
(29, 'clubs', '3', 3, 'CARD_CLUBS_3', '3 of Clubs', '2025-08-05 05:05:51'),
(30, 'clubs', '4', 4, 'CARD_CLUBS_4', '4 of Clubs', '2025-08-05 05:05:51'),
(31, 'clubs', '5', 5, 'CARD_CLUBS_5', '5 of Clubs', '2025-08-05 05:05:51'),
(32, 'clubs', '6', 6, 'CARD_CLUBS_6', '6 of Clubs', '2025-08-05 05:05:51'),
(33, 'clubs', '7', 7, 'CARD_CLUBS_7', '7 of Clubs', '2025-08-05 05:05:51'),
(34, 'clubs', '8', 8, 'CARD_CLUBS_8', '8 of Clubs', '2025-08-05 05:05:51'),
(35, 'clubs', '9', 9, 'CARD_CLUBS_9', '9 of Clubs', '2025-08-05 05:05:51'),
(36, 'clubs', '10', 10, 'CARD_CLUBS_10', '10 of Clubs', '2025-08-05 05:05:51'),
(37, 'clubs', 'J', 10, 'CARD_CLUBS_J', 'J of Clubs', '2025-08-05 05:05:51'),
(38, 'clubs', 'Q', 10, 'CARD_CLUBS_Q', 'Q of Clubs', '2025-08-05 05:05:51'),
(39, 'clubs', 'K', 10, 'CARD_CLUBS_K', 'K of Clubs', '2025-08-05 05:05:51'),
(40, 'spades', 'A', 11, 'CARD_SPADES_A', 'A of Spades', '2025-08-05 05:05:51'),
(41, 'spades', '2', 2, 'CARD_SPADES_2', '2 of Spades', '2025-08-05 05:05:51'),
(42, 'spades', '3', 3, 'CARD_SPADES_3', '3 of Spades', '2025-08-05 05:05:51'),
(43, 'spades', '4', 4, 'CARD_SPADES_4', '4 of Spades', '2025-08-05 05:05:51'),
(44, 'spades', '5', 5, 'CARD_SPADES_5', '5 of Spades', '2025-08-05 05:05:51'),
(45, 'spades', '6', 6, 'CARD_SPADES_6', '6 of Spades', '2025-08-05 05:05:51'),
(46, 'spades', '7', 7, 'CARD_SPADES_7', '7 of Spades', '2025-08-05 05:05:51'),
(47, 'spades', '8', 8, 'CARD_SPADES_8', '8 of Spades', '2025-08-05 05:05:51'),
(48, 'spades', '9', 9, 'CARD_SPADES_9', '9 of Spades', '2025-08-05 05:05:51'),
(49, 'spades', '10', 10, 'CARD_SPADES_10', '10 of Spades', '2025-08-05 05:05:51'),
(50, 'spades', 'J', 10, 'CARD_SPADES_J', 'J of Spades', '2025-08-05 05:05:51'),
(51, 'spades', 'Q', 10, 'CARD_SPADES_Q', 'Q of Spades', '2025-08-05 05:05:51'),
(52, 'spades', 'K', 10, 'CARD_SPADES_K', 'K of Spades', '2025-08-05 05:05:51');

-- --------------------------------------------------------

--
-- Table structure for table `game_answer_history`
--

CREATE TABLE `game_answer_history` (
  `id` int(11) NOT NULL,
  `session_id` varchar(50) NOT NULL,
  `round_number` int(11) NOT NULL,
  `player_name` varchar(100) NOT NULL,
  `question_id` int(11) NOT NULL,
  `player_answer` text DEFAULT NULL,
  `correct_answer` text DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT 0,
  `question_score` int(11) DEFAULT 0,
  `card_bonus_score` int(11) DEFAULT 0,
  `total_score_gained` int(11) DEFAULT 0,
  `new_total_score` int(11) DEFAULT 0,
  `answered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_card_comparisons`
--

CREATE TABLE `game_card_comparisons` (
  `id` int(11) NOT NULL,
  `session_id` varchar(50) NOT NULL,
  `round_number` int(11) NOT NULL,
  `player_name` varchar(100) NOT NULL,
  `player_card_value` int(11) NOT NULL,
  `dealer_card_value` int(11) NOT NULL,
  `beats_dealer` tinyint(1) NOT NULL,
  `bonus_awarded` int(11) DEFAULT 0,
  `new_score` int(11) NOT NULL,
  `comparison_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_players`
--

CREATE TABLE `game_players` (
  `id` int(11) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `socket_id` varchar(255) NOT NULL,
  `player_name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `total_score` int(11) DEFAULT 0,
  `is_dealer` tinyint(1) DEFAULT 0,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `card_bonus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`card_bonus`)),
  `bonus_marks` int(11) DEFAULT 0,
  `round_1_cards` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`round_1_cards`)),
  `round_2_cards` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`round_2_cards`)),
  `round_3_cards` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`round_3_cards`)),
  `round_4_cards` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`round_4_cards`)),
  `round_5_cards` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`round_5_cards`)),
  `round_1_card_value` int(11) DEFAULT 0,
  `round_2_card_value` int(11) DEFAULT 0,
  `round_3_card_value` int(11) DEFAULT 0,
  `round_4_card_value` int(11) DEFAULT 0,
  `round_5_card_value` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_questions_used`
--

CREATE TABLE `game_questions_used` (
  `id` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `question_id` int(11) NOT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_sessions`
--

CREATE TABLE `game_sessions` (
  `id` int(11) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `game_state` enum('waiting','playing','finished') DEFAULT 'waiting',
  `current_round` int(11) DEFAULT 0,
  `max_rounds` int(11) DEFAULT 5,
  `dealer_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `option_a` varchar(255) NOT NULL,
  `option_b` varchar(255) NOT NULL,
  `option_c` varchar(255) NOT NULL,
  `option_d` varchar(255) NOT NULL,
  `correct_answer` enum('A','B','C','D') NOT NULL,
  `difficulty` enum('easy','normal') DEFAULT 'normal',
  `category` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `difficulty`, `category`, `created_at`) VALUES
(1, 'What will be the output of this code?\n\nx = 10\nif x > 5:\n    print(\"Greater\")\nelse:\n    print(\"Smaller\")', 'Greater', 'Smaller', 'Error', 'Nothing', 'A', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(2, 'Which operator is used for \"not equal to\" in Python?', '!=', '<>', '=/=', 'not=', 'A', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(3, 'What is the correct syntax for an if-elif-else statement?', 'if condition: elif condition: else:', 'if (condition) elif (condition) else', 'if condition then elif condition then else', 'if condition; elif condition; else;', 'A', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(4, 'What will be the output?\n\nfor i in range(3):\n    print(i)', '0 1 2', '1 2 3', '0 1 2 3', 'Error', 'A', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(5, 'What will be the output?\n\nfor i in range(1, 4):\n    print(i)', '1 2 3', '0 1 2 3', '1 2 3 4', 'Error', 'A', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(6, 'What will be the output?\n\ni = 0\nwhile i < 3:\n    print(i)\n    i += 1', '0 1 2', '1 2 3', '0 1 2 3', 'Infinite loop', 'A', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(7, 'What happens if you forget to increment the counter in a while loop?', 'Loop runs once', 'Loop never runs', 'Infinite loop', 'Syntax error', 'C', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(8, 'What does the \"break\" statement do in a loop?', 'Skips current iteration', 'Exits the loop completely', 'Restarts the loop', 'Pauses the loop', 'B', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(9, 'What does the \"continue\" statement do?', 'Exits the loop', 'Skips to next iteration', 'Repeats current iteration', 'Stops the program', 'B', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(10, 'What is the result of: True and False?', 'True', 'False', 'Error', 'None', 'B', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(11, 'What is the result of: True or False?', 'True', 'False', 'Error', 'None', 'A', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(12, 'What is the result of: not True?', 'True', 'False', '0', '1', 'B', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(13, 'Which comparison operator checks if two values are equal?', '=', '==', '===', 'eq', 'B', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(14, 'What does the <= operator check?', 'Less than', 'Less than or equal to', 'Not equal to', 'Greater than', 'B', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(15, 'What does range(5) generate?', '0, 1, 2, 3, 4', '1, 2, 3, 4, 5', '0, 1, 2, 3, 4, 5', '5', 'A', 'easy', 'Python Control Flow', '2025-08-06 15:53:49'),
(16, 'What will be printed?\n\nage = 18\nif age >= 18:\n    print(\"Adult\")\nelif age >= 13:\n    print(\"Teen\")\nelse:\n    print(\"Child\")', 'Adult', 'Teen', 'Child', 'Error', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(17, 'What will be printed?\n\nx = 5\ny = 10\nif x < 10 and y > 5:\n    print(\"Both true\")\nelse:\n    print(\"Not both true\")', 'Both true', 'Not both true', 'Error', 'Nothing', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(18, 'What will be the result of: 5 > 3 and 2 < 1?', 'True', 'False', 'Error', 'None', 'B', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(19, 'How many times will this loop execute?\n\nfor i in range(2, 8, 2):\n    print(i)', '3 times', '4 times', '6 times', '2 times', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(20, 'What does range(5, 15, 3) generate?', '5, 8, 11, 14', '5, 8, 11, 14, 17', '6, 9, 12, 15', '5, 6, 7, 8, 9', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(21, 'What will be printed?\n\nfruits = [\"apple\", \"banana\"]\nfor fruit in fruits:\n    print(len(fruit))', '5 6', 'apple banana', '2', 'Error', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(22, 'What will be printed?\n\ncount = 5\nwhile count > 0:\n    print(count)\n    count -= 2', '5 3 1', '5 4 3 2 1', '3 1', 'Infinite loop', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(23, 'What will be printed?\n\nfor i in range(5):\n    if i == 2:\n        continue\n    print(i)', '0 1 3 4', '0 1 2 3 4', '0 1', '2 3 4', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(24, 'What will be printed?\n\nfor i in range(5):\n    if i == 3:\n        break\n    print(i)', '0 1 2', '0 1 2 3', '3 4', '0 1 2 3 4', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(25, 'How many times will \"Hello\" be printed?\n\nfor i in range(2):\n    for j in range(3):\n        print(\"Hello\")', '2 times', '3 times', '5 times', '6 times', 'D', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(26, 'What will be the output?\n\nfor i in range(2):\n    for j in range(2):\n        print(i, j)', '0 0, 0 1, 1 0, 1 1', '0 1, 1 0', '0 0, 1 1', '1 1, 2 2', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(27, 'What will happen?\n\nwhile True:\n    print(\"Hello\")\n    break', 'Prints Hello once', 'Infinite loop', 'Error', 'Nothing printed', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(28, 'What is the purpose of the \"pass\" statement?', 'Skip iteration', 'Exit loop', 'Do nothing placeholder', 'Raise error', 'C', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(29, 'What will be printed?\n\nfor i in range(3):\n    if i == 1:\n        pass\n    print(i)', '0 2', '0 1 2', '1', 'Error', 'B', 'normal', 'Python Control Flow', '2025-08-06 15:54:03'),
(30, 'What will be the result?\n\nnums = [1, 2, 3, 4, 5]\nfor num in nums:\n    if num % 2 == 0:\n        print(num)', '2 4', '1 3 5', '1 2 3 4 5', 'Error', 'A', 'normal', 'Python Control Flow', '2025-08-06 15:54:03');

-- --------------------------------------------------------

--
-- Table structure for table `simple_game_history`
--

CREATE TABLE `simple_game_history` (
  `id` int(11) NOT NULL,
  `session_id` varchar(50) NOT NULL,
  `player_name` varchar(100) NOT NULL,
  `final_score` int(11) NOT NULL,
  `final_rank` int(11) NOT NULL,
  `is_dealer` tinyint(1) DEFAULT 0,
  `is_winner` tinyint(1) DEFAULT 0,
  `game_date` date NOT NULL,
  `game_time` time NOT NULL,
  `game_completed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `student_id` int(5) NOT NULL,
  `student_username` varchar(50) DEFAULT NULL,
  `student_password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cards`
--
ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `qr_data` (`qr_data`);

--
-- Indexes for table `game_answer_history`
--
ALTER TABLE `game_answer_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_round` (`session_id`,`round_number`),
  ADD KEY `idx_player_answers` (`session_id`,`player_name`);

--
-- Indexes for table `game_card_comparisons`
--
ALTER TABLE `game_card_comparisons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_round` (`session_id`,`round_number`);

--
-- Indexes for table `game_players`
--
ALTER TABLE `game_players`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `game_questions_used`
--
ALTER TABLE `game_questions_used`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_session_question` (`session_id`,`question_id`),
  ADD KEY `idx_session_id` (`session_id`),
  ADD KEY `idx_question_id` (`question_id`);

--
-- Indexes for table `game_sessions`
--
ALTER TABLE `game_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_id` (`session_id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `simple_game_history`
--
ALTER TABLE `simple_game_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_player_history` (`player_name`),
  ADD KEY `idx_game_date` (`game_date`),
  ADD KEY `idx_session` (`session_id`);

--
-- Indexes for table `student`
--
ALTER TABLE `student`
  ADD PRIMARY KEY (`student_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cards`
--
ALTER TABLE `cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `game_answer_history`
--
ALTER TABLE `game_answer_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT for table `game_card_comparisons`
--
ALTER TABLE `game_card_comparisons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `game_players`
--
ALTER TABLE `game_players`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=660;

--
-- AUTO_INCREMENT for table `game_questions_used`
--
ALTER TABLE `game_questions_used`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=329;

--
-- AUTO_INCREMENT for table `game_sessions`
--
ALTER TABLE `game_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=328;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `simple_game_history`
--
ALTER TABLE `simple_game_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `student_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `game_players`
--
ALTER TABLE `game_players`
  ADD CONSTRAINT `game_players_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`session_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
