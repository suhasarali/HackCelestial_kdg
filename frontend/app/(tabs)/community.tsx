// import React from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

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

// // --- PostCard Component ---
// interface PostCardProps {
//   firstName: string;
//   lastName: string | null;
//   userName: string;
//   userHandle: string;
//   content: string;
//   likes: number;
// }

// const PostCard: React.FC<PostCardProps> = ({ firstName, lastName, userName, userHandle, content, likes }) => {
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
//       <View style={cardStyles.footer}>
//         <Text style={cardStyles.likeIcon}>❤️</Text>
//         <Text style={cardStyles.likeCount}>{likes}</Text>
//       </View>
//     </View>
//   );
// };

// const cardStyles = StyleSheet.create({
//   cardContainer: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#222',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   userNameText: {
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   userHandleText: {
//     color: '#aaa',
//   },
//   content: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#eee',
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
//   { id: '1', firstName: 'Silvia', lastName: null, userName: 'Silvia', userHandle: '@machadocomida', content: "ppl keep saying hot girl summer but i'm just trying to stay out of the humidity", likes: 12 },
//   { id: '2', firstName: 'Jasi', lastName: 'Singh', userName: 'Jasi', userHandle: '@k9lover85', content: "Pop songs just hit different when you're driving", likes: 20 },
//   { id: '3', firstName: 'Vera', lastName: 'Cordeiro', userName: 'Vera', userHandle: '@Veracordeiro20', content: "Help i can't stop canceling meetings", likes: 6 },
//   { id: '4', firstName: 'Harold', lastName: 'Wang', userName: 'Harold', userHandle: '@h_wang84', content: "There are too many people outside", likes: 25 },
//   { id: '5', firstName: 'Rohan', lastName: 'Bhangale', userName: 'Rohan Bhangale', userHandle: '@rohan_b', content: "I'm building this awesome app!", likes: 101 },
//   { id: '6', firstName: 'Allen', lastName: 'Graysays', userName: 'Allen', userHandle: '@grayhamsays', content: "Just saw a movie trailer that looks amazing.", likes: 32 },
// ];

// // --- Main Community Component ---
// const community = () => {
//   const handleAddBlog = () => {
//     // This is where you would navigate to a new screen or open a modal
//     // to allow the user to create a new post.
//     alert('Add Blog button pressed!');
//   };

//   return (
//     <View style={communityStyles.container}>
//       <Text style={communityStyles.pageTitle}>Rohan Bhangale</Text>
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
//           />
//         )}
//         keyExtractor={item => item.id}
//       />
      
//       {/* Floating Add Button */}
//       <TouchableOpacity 
//         style={communityStyles.addButton}
//         onPress={handleAddBlog}
//       >
//         <Text style={communityStyles.addButtonText}>+</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const communityStyles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingTop: 50,
//   },
//   pageTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 20,
//     color: '#fff',
//   },
//   addButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 30,
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#1E90FF', // A nice vibrant blue for the button
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 8, // Adds shadow on Android
//     shadowColor: '#fff', // Adds shadow on iOS
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

// export default community;


import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable } from 'react-native';

// --- UserAvatar Component ---
const generateColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  const hue = parseInt(color.substring(1, 7), 16) % 360;
  return `hsl(${hue}, 50%, 75%)`;
};

const UserAvatar = ({ firstName, lastName }) => {
  let initials = '';
  if (firstName) {
    initials += firstName[0].toUpperCase();
  }
  if (lastName) {
    initials += lastName[0].toUpperCase();
  } else if (firstName && firstName.length > 1) {
    initials = firstName.substring(0, 2).toUpperCase();
  }

  const backgroundColor = generateColor(firstName + (lastName || ''));

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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

// --- Tag Component ---
const Tag = ({ text }) => {
  return (
    <View style={tagStyles.container}>
      <Text style={tagStyles.text}>{text}</Text>
    </View>
  );
};

const tagStyles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginTop: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
  },
});

// --- PostCard Component ---
const PostCard = ({ firstName, lastName, userName, userHandle, content, likes, tags }) => {
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
      <View style={cardStyles.footer}>
        <Text style={cardStyles.likeIcon}>❤️</Text>
        <Text style={cardStyles.likeCount}>{likes}</Text>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    marginVertical: 10,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    fontWeight: 'bold',
    color: '#000000ff',
  },
  userHandleText: {
    color: '#000000ff',
  },
  content: {
    marginTop: 10,
    fontSize: 16,
    color: '#000000ff',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  likeIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  likeCount: {
    color: '#888',
  },
});

// --- Dummy Posts Data ---
const posts = [
  { id: '1', firstName: 'Silvia', lastName: null, userName: 'Silvia', userHandle: '@machadocomida', content: "ppl keep saying hot girl summer but i'm just trying to stay out of the humidity", likes: 12, tags: ['summer', 'humidity'] },
  { id: '2', firstName: 'Jasi', lastName: 'Singh', userName: 'Jasi', userHandle: '@k9lover85', content: "Pop songs just hit different when you're driving", likes: 20, tags: ['music', 'driving', 'roadtrip'] },
  { id: '3', firstName: 'Vera', lastName: 'Cordeiro', userName: 'Vera', userHandle: '@Veracordeiro20', content: "Help i can't stop canceling meetings", likes: 6, tags: ['work', 'life'] },
  { id: '4', firstName: 'Harold', lastName: 'Wang', userName: 'Harold', userHandle: '@h_wang84', content: "There are too many people outside", likes: 25, tags: ['social', 'introvert'] },
  { id: '5', firstName: 'Rohan', lastName: 'Bhangale', userName: 'Rohan Bhangale', userHandle: '@rohan_b', content: "I'm building this awesome app!", likes: 101, tags: ['react-native', 'coding', 'hackathon'] },
];

// --- Main Community Component ---
const community = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  const handleAddBlog = () => {
    // Logic to add the new post to the list (e.g., send to a backend)
    console.log('New Post Content:', newContent);
    console.log('New Tags:', newTags);
    setModalVisible(false);
    setNewContent('');
    setNewTags('');
  };

  return (
    <View style={communityStyles.container}>
      <Text style={communityStyles.pageTitle}>Community Feedback</Text>
      
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard
            firstName={item.firstName}
            lastName={item.lastName}
            userName={item.userName}
            userHandle={item.userHandle}
            content={item.content}
            likes={item.likes}
            tags={item.tags}
          />
        )}
        keyExtractor={item => item.id}
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
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Text style={modalStyles.modalTitle}>Add New Blog</Text>
            <TextInput
              style={modalStyles.input}
              onChangeText={setNewContent}
              value={newContent}
              placeholder="What's on your mind?"
              placeholderTextColor="#888"
              multiline={true}
            />
            <TextInput
              style={modalStyles.input}
              onChangeText={setNewTags}
              value={newTags}
              placeholder="Add tags (e.g., tag1, tag2)"
              placeholderTextColor="#888"
            />
            <Pressable
              style={[modalStyles.button, modalStyles.buttonAdd]}
              onPress={handleAddBlog}
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
    backgroundColor: '#fff', // White background
    paddingTop: 50,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000000ff', // Black text
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#569acdff', // Black button for contrast
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: 'white',
    lineHeight: 30,
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black overlay
  },
  modalView: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  input: {
    width: '100%',
    minHeight: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    color: '#000',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  buttonAdd: {
    backgroundColor: '#000',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default community;