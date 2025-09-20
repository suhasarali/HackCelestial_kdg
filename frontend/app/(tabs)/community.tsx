/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- UserAvatar Component ---
const generateColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  const hue = parseInt(color.substring(1, 7), 16) % 360;
  return `hsl(${hue}, 50%, 75%)`;
};

const UserAvatar = ({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string | null;
}) => {
  let initials = "";
  if (firstName) {
    initials += firstName[0]?.toUpperCase() || "";
  }
  if (lastName) {
    initials += lastName[0]?.toUpperCase() || "";
  } else if (firstName && firstName.length > 1) {
    initials = firstName.substring(0, 2).toUpperCase();
  }

  const backgroundColor = generateColor(firstName + (lastName || ""));

  return (
    <View style={[avatarStyles.avatarContainer, { backgroundColor }]}>
      <Text style={avatarStyles.initialsText}>{initials}</Text>
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});

// --- Tag Component ---
const Tag = ({ text }: { text: string }) => {
  return (
    <View style={tagStyles.container}>
      <Text style={tagStyles.text}>{text}</Text>
    </View>
  );
};

const tagStyles = StyleSheet.create({
  container: {
    backgroundColor: "#333",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginTop: 8,
  },
  text: {
    color: "#fff",
    fontSize: 12,
  },
});

// --- PostCard Component ---
interface PostCardProps {
  id: string;
  firstName: string;
  lastName: string | null;
  userName: string;
  userHandle: string;
  content: string;
  likes: number;
  tags: string[];
}

const PostCard: React.FC<PostCardProps> = ({
  firstName,
  lastName,
  userName,
  userHandle,
  content,
  likes,
  tags,
}) => {
  return (
    <View style={cardStyles.cardContainer}>
      <View style={cardStyles.header}>
        <UserAvatar firstName={firstName} lastName={lastName} />
        <View>
          <Text style={cardStyles.userNameText}>{userName}</Text>
          <Text style={cardStyles.userHandleText}>{userHandle}</Text>
        </View>
      </View>
      <Text style={cardStyles.content}>{content}</Text>
      <View style={cardStyles.tagContainer}>
        {tags.map((tag, index) => (
          <Tag key={index} text={tag} />
        ))}
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#ffffffff",
    borderRadius: 10,
    marginVertical: 10,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  userNameText: {
    fontWeight: "bold",
    color: "#000000ff",
  },
  userHandleText: {
    color: "#000000ff",
  },
  content: {
    marginTop: 10,
    fontSize: 16,
    color: "#000000ff",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  footer: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  likeIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  likeCount: {
    color: "#888",
  },
});

// Interface to match the backend data structure
interface Observation {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  title?: string;
  description: string;
  tags: string[];
  createdAt: string;
  likes?: any[];
}

// --- Main Community Component ---
const community = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [posts, setPosts] = useState<Observation[]>([]); // Using the new Observation interface
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:5000/api/observations/";

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(API_URL);
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Replace your existing handleAddPost function with this one
  const handleAddPost = async () => {
    console.log("POST DATA:", {
      title,
      description,
      tags: tags.split(",").map((t) => t.trim()),
    });
    const token = await AsyncStorage.getItem("token");
    console.log("TOKEN:", token);

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Authentication Error", "Please log in to add a post.");
        setModalVisible(false);
        return;
      }

      const postData = {
        title,
        description,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await axios.post(API_URL, postData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data && res.data._id) {
        setPosts([res.data, ...posts]);
        console.log("Post added successfully:", res.data);
      } else {
        Alert.alert("Post Failed", "Server returned an invalid response.");
        console.error("Invalid response data:", res.data);
      }
    } catch (err) {
      // This is where the error from the stack trace is being thrown
      console.error("Error in handleAddPost:", err);
      Alert.alert(
        "Post Failed",
        "An unexpected error occurred. Please try again."
      );
    } finally {
      // Ensure modal is closed and form is reset regardless of success or failure
      setModalVisible(false);
      setTitle("");
      setDescription("");
      setTags("");
    }
  };

  if (loading) {
    return (
      <View style={communityStyles.centered}>
        <ActivityIndicator size="large" color="#569acd" />
        <Text style={communityStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={communityStyles.container}>
      <Text style={communityStyles.pageTitle}>Community Feedback</Text>

      <FlatList
        data={posts}
        renderItem={({ item }) => {
          // Your backend returns an object with a 'user' field containing a 'name'
          const userName = item.user?.name || "Anonymous";
          const nameParts = userName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.length > 1 ? nameParts[1] : null;

          return (
            <PostCard
              id={item._id} // ✅ FIX 2: Use `_id` from the backend
              firstName={firstName}
              lastName={lastName}
              userName={userName}
              userHandle={`@${firstName.toLowerCase()}`}
              content={item.description}
              likes={item.likes?.length || 0} // Assuming your model has a likes array
              tags={item.tags || []}
            />
          );
        }}
        keyExtractor={(item) => item._id} // ✅ FIX 3: Use `_id` from the backend
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={communityStyles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={communityStyles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Modal for Adding Content */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>Add New Blog</Text>
            <TextInput
              style={modalStyles.input}
              onChangeText={setTitle}
              value={title}
              placeholder="Add a title (optional)"
              placeholderTextColor="#888"
            />
            <TextInput
              style={modalStyles.input}
              onChangeText={setDescription}
              value={description}
              placeholder="What's on your mind?"
              placeholderTextColor="#888"
              multiline={true}
            />
            <TextInput
              style={modalStyles.input}
              onChangeText={setTags}
              value={tags}
              placeholder="Add tags (e.g., tag1, tag2)"
              placeholderTextColor="#888"
            />
            <Pressable
              style={[modalStyles.button, modalStyles.buttonAdd]}
              onPress={handleAddPost}
            >
              <Text style={modalStyles.textStyle}>Add Detail</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const communityStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#000000ff",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#569acdff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: "white",
    lineHeight: 30,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  input: {
    width: "100%",
    minHeight: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    color: "#000",
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  buttonAdd: {
    backgroundColor: "#000",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default community;
