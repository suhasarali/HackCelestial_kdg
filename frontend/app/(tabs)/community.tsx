// /* eslint-disable react-hooks/rules-of-hooks */

// import React, { useState } from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable } from 'react-native';

// // --- UserAvatar Component ---
// const generateColor = (name: string) => {
//   let hash = 0;
//   for (let i = 0; i < name.length; i++) {
//     hash = name.charCodeAt(i) + ((hash << 5) - hash);
//   }
//   let color = '#';
//   for (let i = 0; i < 3; i++) {
//     const value = (hash >> (i * 8)) & 0xFF;
//     color += ('00' + value.toString(16)).substr(-2);
//   }
//   const hue = parseInt(color.substring(1, 7), 16) % 360;
//   return `hsl(${hue}, 50%, 75%)`;
// };

// const UserAvatar = ({ firstName, lastName }: { firstName: string; lastName: string | null }) => {
//   let initials = '';
//   if (firstName) {
//     initials += firstName[0].toUpperCase();
//   }
//   if (lastName) {
//     initials += lastName[0].toUpperCase();
//   } else if (firstName && firstName.length > 1) {
//     initials = firstName.substring(0, 2).toUpperCase();
//   }

//   const backgroundColor = generateColor(firstName + (lastName || ''));

//   return (
//     <View style={[avatarStyles.avatarContainer, { backgroundColor }]}>
//       <Text style={avatarStyles.initialsText}>{initials}</Text>
//     </View>
//   );
// };

// const avatarStyles = StyleSheet.create({
//   avatarContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//   },
//   initialsText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//   },
// });

// // --- Tag Component ---
// const Tag = ({ text }: { text: string }) => {
//   return (
//     <View style={tagStyles.container}>
//       <Text style={tagStyles.text}>{text}</Text>
//     </View>
//   );
// };

// const tagStyles = StyleSheet.create({
//   container: {
//     backgroundColor: '#333',
//     borderRadius: 5,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     marginRight: 6,
//     marginTop: 8,
//   },
//   text: {
//     color: '#fff',
//     fontSize: 12,
//   },
// });

// // --- PostCard Component ---
// interface PostCardProps {
//   firstName: string;
//   lastName: string | null;
//   userName: string;
//   userHandle: string;
//   content: string;
//   likes: number;
//   tags: string[];
// }

// const PostCard: React.FC<PostCardProps> = ({ firstName, lastName, userName, userHandle, content, likes, tags }) => {
//   return (
//     <View style={cardStyles.cardContainer}>
//       <View style={cardStyles.header}>
//         <UserAvatar firstName={firstName} lastName={lastName} />
//         <View>
//           <Text style={cardStyles.userNameText}>{userName}</Text>
//           <Text style={cardStyles.userHandleText}>{userHandle}</Text>
//         </View>
//       </View>
//       <Text style={cardStyles.content}>{content}</Text>
//       <View style={cardStyles.tagContainer}>
//         {tags.map((tag, index) => (
//           <Tag key={index} text={tag} />
//         ))}
//       </View>
//       <View style={cardStyles.footer}>
//         <Text style={cardStyles.likeIcon}>❤️</Text>
//         <Text style={cardStyles.likeCount}>{likes}</Text>
//       </View>
//     </View>
//   );
// };

// const cardStyles = StyleSheet.create({
//   cardContainer: {
//     backgroundColor: '#ffffffff',
//     borderRadius: 10,
//     marginVertical: 10,
//     marginHorizontal: 16,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 2, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   userNameText: {
//     fontWeight: 'bold',
//     color: '#000000ff',
//   },
//   userHandleText: {
//     color: '#000000ff',
//   },
//   content: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#000000ff',
//   },
//   tagContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   footer: {
//     flexDirection: 'row',
//     marginTop: 10,
//     alignItems: 'center',
//   },
//   likeIcon: {
//     fontSize: 20,
//     marginRight: 5,
//   },
//   likeCount: {
//     color: '#888',
//   },
// });

// // --- Dummy Posts Data ---
// const posts = [
//   { id: '1', firstName: 'Silvia', lastName: null, userName: 'Silvia', userHandle: '@machadocomida', content: "ppl keep saying hot girl summer but i'm just trying to stay out of the humidity", likes: 12, tags: ['summer', 'humidity'] },
//   { id: '2', firstName: 'Jasi', lastName: 'Singh', userName: 'Jasi', userHandle: '@k9lover85', content: "Pop songs just hit different when you're driving", likes: 20, tags: ['music', 'driving', 'roadtrip'] },
//   { id: '3', firstName: 'Vera', lastName: 'Cordeiro', userName: 'Vera', userHandle: '@Veracordeiro20', content: "Help i can't stop canceling meetings", likes: 6, tags: ['work', 'life'] },
//   { id: '4', firstName: 'Harold', lastName: 'Wang', userName: 'Harold', userHandle: '@h_wang84', content: "There are too many people outside", likes: 25, tags: ['social', 'introvert'] },
//   { id: '5', firstName: 'Rohan', lastName: 'Bhangale', userName: 'Rohan Bhangale', userHandle: '@rohan_b', content: "I'm building this awesome app!", likes: 101, tags: ['react-native', 'coding', 'hackathon'] },
// ];

// // --- Main Community Component ---
// const community = () => {
//   const [modalVisible, setModalVisible] = useState(false);
//   const [newContent, setNewContent] = useState('');
//   const [newTags, setNewTags] = useState('');

//   const handleAddBlog = () => {
//     // Logic to add the new post to the list (e.g., send to a backend)
//     console.log('New Post Content:', newContent);
//     console.log('New Tags:', newTags);
//     setModalVisible(false);
//     setNewContent('');
//     setNewTags('');
//   };

//   return (
//     <View style={communityStyles.container}>
//       <Text style={communityStyles.pageTitle}>Community Feedback</Text>
      
//       <FlatList
//         data={posts}
//         renderItem={({ item }) => (
//           <PostCard
//             firstName={item.firstName}
//             lastName={item.lastName}
//             userName={item.userName}
//             userHandle={item.userHandle}
//             content={item.content}
//             likes={item.likes}
//             tags={item.tags}
//           />
//         )}
//         keyExtractor={item => item.id}
//       />
      
//       {/* Floating Add Button */}
//       <TouchableOpacity 
//         style={communityStyles.addButton}
//         onPress={() => setModalVisible(true)}
//       >
//         <Text style={communityStyles.addButtonText}>+</Text>
//       </TouchableOpacity>

//       {/* Modal for Adding Content */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(!modalVisible)}
//       >
//         <View style={modalStyles.centeredView}>
//           <View style={modalStyles.modalView}>
//             <Text style={modalStyles.modalTitle}>Add New Blog</Text>
//             <TextInput
//               style={modalStyles.input}
//               onChangeText={setNewContent}
//               value={newContent}
//               placeholder="What's on your mind?"
//               placeholderTextColor="#888"
//               multiline={true}
//             />
//             <TextInput
//               style={modalStyles.input}
//               onChangeText={setNewTags}
//               value={newTags}
//               placeholder="Add tags (e.g., tag1, tag2)"
//               placeholderTextColor="#888"
//             />
//             <Pressable
//               style={[modalStyles.button, modalStyles.buttonAdd]}
//               onPress={handleAddBlog}
//             >
//               <Text style={modalStyles.textStyle}>Add Detail</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const communityStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff', // White background
//     paddingTop: 50,
//   },
//   pageTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 20,
//     color: '#000000ff', // Black text
//   },
//   addButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 30,
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#569acdff', // Black button for contrast
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 5,
//   },
//   addButtonText: {
//     fontSize: 30,
//     color: 'white',
//     lineHeight: 30,
//   },
// });

// const modalStyles = StyleSheet.create({
//   centeredView: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black overlay
//   },
//   modalView: {
//     margin: 20,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 35,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//     width: '90%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     color: '#000',
//   },
//   input: {
//     width: '100%',
//     minHeight: 50,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 10,
//     marginBottom: 15,
//     color: '#000',
//   },
//   button: {
//     borderRadius: 10,
//     padding: 10,
//     elevation: 2,
//   },
//   buttonAdd: {
//     backgroundColor: '#000',
//   },
//   textStyle: {
//     color: 'white',
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
// });

// export default community;


// /* eslint-disable react-hooks/rules-of-hooks */


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
} from "react-native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';



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
  if (firstName) initials += firstName[0].toUpperCase();
  if (lastName) initials += lastName[0].toUpperCase();
  else if (firstName && firstName.length > 1) {
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
const Tag = ({ text }: { text: string }) => (
  <View style={tagStyles.container}>
    <Text style={tagStyles.text}>{text}</Text>
  </View>
);

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
  userName: string;
  userHandle?: string;
  content: string;
  likes?: number;
  tags: string[];
}

const PostCard: React.FC<PostCardProps> = ({
  userName,
  userHandle,
  content,
  likes = 0,
  tags,
}) => {
  const [firstName, lastName] = userName.split(" ");
  return (
    <View style={cardStyles.cardContainer}>
      <View style={cardStyles.header}>
        <UserAvatar firstName={firstName} lastName={lastName || null} />
        <View>
          <Text style={cardStyles.userNameText}>{userName}</Text>
          {userHandle && <Text style={cardStyles.userHandleText}>{userHandle}</Text>}
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
    backgroundColor: "#fff",
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
    color: "#000",
  },
  userHandleText: {
    color: "#666",
  },
  content: {
    marginTop: 10,
    fontSize: 16,
    color: "#000",
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

// --- Main Community Component ---
const Community = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const API_URL = "https://hackcelestial-kdg.onrender.com/api/observations"; // update for mobile (use IP)

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


const handleAddPost = async () => {
  try {
    // 1️⃣ Get token from AsyncStorage (or your auth state)
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      console.error("No token found. User may not be logged in.");
      return;
    }

    // 2️⃣ Prepare post data
    const postData = {
      title,
      description,
      tags: tags.split(",").map((t) => t.trim()),
    };

    // 3️⃣ Send POST request with token in headers
    const res = await axios.post(
      API_URL,
      postData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // explicitly send token
          "Content-Type": "application/json",
        },
      }
    );

    // 4️⃣ Update local state
    setPosts([res.data, ...posts]); // prepend new post
    setModalVisible(false);          // close modal
    setTitle("");                     // reset form
    setDescription("");
    setTags("");

    console.log("Post added successfully:", res.data);

  } catch (err) {
    // 5️⃣ Handle errors
    if (axios.isAxiosError(err)) {
      if (err.response) {
        console.error("Error adding post:", err.response.status, err.response.data);
      } else if (err.request) {
        console.error("No response received:", err.request);
      } else {
        console.error("Axios error:", err.message);
      }
    } else {
      console.error("Unexpected error:", err);
    }
  }
};

  if (loading) {
    return (
      <View style={communityStyles.centered}>
        <ActivityIndicator size="large" color="#569acd" />
      </View>
    );
  }

  return (
    <View style={communityStyles.container}>
      <Text style={communityStyles.pageTitle}>Community Feedback</Text>

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard
            userName={item.user?.name || "Anonymous"}
            content={item.description || ""}
            tags={item.tags}
            likes={0}
          />
        )}
        keyExtractor={(item) => item._id}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={communityStyles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={communityStyles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>Add New Post</Text>

            <TextInput
              style={modalStyles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#888"
            />

            <TextInput
              style={modalStyles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#888"
            />

            <TextInput
              style={modalStyles.input}
              placeholder="Tags (comma separated)"
              value={tags}
              onChangeText={setTags}
              placeholderTextColor="#888"
            />

            <Pressable
              style={[modalStyles.button, modalStyles.buttonAdd]}
              onPress={handleAddPost}
            >
              <Text style={modalStyles.textStyle}>Add Post</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const communityStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 50 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#569acd",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  addButtonText: { fontSize: 30, color: "white", lineHeight: 30 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, color: "#000" },
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
  button: { borderRadius: 10, padding: 10, elevation: 2 },
  buttonAdd: { backgroundColor: "#000", width: "100%" },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" },
});

export default Community;
